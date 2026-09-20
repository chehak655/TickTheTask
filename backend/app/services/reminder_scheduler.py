"""
Background Reminder Scheduler — monitors task deadlines and dispatches email notifications.
Ensures idempotency and duplicate prevention via the task_reminders log table.
"""
import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database.session import SessionLocal
from app.models.task import Task, TaskStatus
from app.models.reminder import TaskReminderLog
from app.services.email_service import send_task_reminder_email


import logging
from sqlalchemy.exc import IntegrityError

logger = logging.getLogger(__name__)

def check_and_send_due_reminders(db: Session) -> int:
    """
    Find incomplete tasks whose reminder window has arrived and send notifications.
    Returns count of sent reminders.
    """
    now_utc = datetime.now(timezone.utc)
    
    # Fetch pending tasks with due dates and enabled reminders
    pending_tasks = (
        db.query(Task)
        .filter(
            Task.status == TaskStatus.PENDING.value,
            Task.due_date.isnot(None),
            Task.reminder_minutes.isnot(None),
        )
        .all()
    )

    sent_count = 0
    for task in pending_tasks:
        if not task.due_date or not task.user:
            continue

        due_date_utc = task.due_date
        if due_date_utc.tzinfo is None:
            due_date_utc = due_date_utc.replace(tzinfo=timezone.utc)

        # The user wants a pre-deadline reminder (defaults to 15), and another exactly when overdue (0).
        preferred_lead = task.reminder_minutes if task.reminder_minutes is not None else 15
        lead_times_to_check = list(set([preferred_lead, 0]))

        for lead_minutes in lead_times_to_check:
            trigger_time = due_date_utc - timedelta(minutes=lead_minutes)

            # Trigger if current time has passed the trigger time
            # For lead_minutes > 0, we only trigger if we are strictly before the due date (pre-deadline).
            # For lead_minutes == 0, we trigger if now >= due_date_utc.
            is_triggered = False
            if lead_minutes > 0:
                is_triggered = trigger_time <= now_utc <= due_date_utc
            else:
                is_triggered = now_utc >= due_date_utc

            if is_triggered:
                # Check if this reminder was already dispatched
                existing_log = (
                    db.query(TaskReminderLog)
                    .filter(
                        TaskReminderLog.task_id == task.id,
                        TaskReminderLog.reminder_minutes == lead_minutes,
                    )
                    .first()
                )

                if existing_log:
                    continue

                # Record log entry to prevent race condition duplicates
                log_entry = TaskReminderLog(
                    task_id=task.id,
                    user_id=task.user_id,
                    reminder_minutes=lead_minutes,
                    status="sent",
                )
                
                try:
                    db.add(log_entry)
                    db.commit()
                    db.refresh(log_entry)

                    # Send email
                    success = send_task_reminder_email(task.user, task, lead_minutes)
                    if not success:
                        log_entry.status = "failed"
                        log_entry.error_message = "SMTP delivery failure"
                        db.commit()
                    else:
                        sent_count += 1
                except IntegrityError:
                    # Another worker processed this reminder at the exact same time
                    db.rollback()
                    logger.debug(f"IntegrityError: Reminder for task {task.id} already processed by another worker.")
                except Exception as e:
                    db.rollback()
                    logger.error(f"Error processing reminder for task {task.id}: {e}", exc_info=True)

    return sent_count


async def reminder_scheduler_loop(poll_interval_seconds: int = 30):
    """
    Asynchronous continuous background loop that runs during application lifespan.
    """
    logger.info(f"TickTheTask Deadline Reminder Worker started (polling every {poll_interval_seconds}s).")
    while True:
        try:
            db = SessionLocal()
            try:
                check_and_send_due_reminders(db)
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Reminder scheduler loop exception: {e}", exc_info=True)

        await asyncio.sleep(poll_interval_seconds)
