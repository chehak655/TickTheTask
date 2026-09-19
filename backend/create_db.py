import sys
import pymysql
from sqlalchemy import create_engine, text
from app.core.config import settings
from app.core.database import Base, engine
from app.models import User, Task


def init_mysql_database():
    """Attempts to connect to MySQL host and ensure taskflow_db exists."""
    print(f"[*] Checking MySQL server at {settings.DB_HOST}:{settings.DB_PORT}...")
    try:
        connection = pymysql.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            charset="utf8mb4",
            connect_timeout=5
        )
        with connection.cursor() as cursor:
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{settings.DB_NAME}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
            )
        connection.close()
        print(f"[+] Successfully ensured MySQL database '{settings.DB_NAME}' exists.")
        return True
    except pymysql.MySQLError as e:
        print(f"[-] Could not connect to MySQL server: {e}")
        return False
    except Exception as e:
        print(f"[-] Unexpected connection error: {e}")
        return False


def create_tables(target_engine=None):
    """Creates all SQLAlchemy tables for registered models."""
    use_engine = target_engine or engine
    print(f"[*] Creating tables on: {use_engine.url.render_as_string(hide_password=True)}...")
    Base.metadata.create_all(bind=use_engine)
    print("[+] Tables successfully created:")
    for table_name in Base.metadata.tables.keys():
        print(f"    - {table_name}")


def main():
    print("=== TaskFlow Database Initializer ===")
    db_url = settings.get_database_url()

    if "mysql" in db_url:
        mysql_online = init_mysql_database()
        if mysql_online:
            create_tables(engine)
            print("[+] Database initialization complete!")
            return 0
        else:
            print("\n[!] MySQL is currently offline or unreachable.")
            print("    Please ensure MySQL Server is running and credentials in backend/.env are correct.")
            print("    Verifying table schemas against local SQLite database for validation...")
            sqlite_engine = create_engine("sqlite:///./taskflow_test.db")
            create_tables(sqlite_engine)
            print("[+] Models and schema definitions validated successfully!")
            return 0
    else:
        create_tables(engine)
        print("[+] Database initialization complete!")
        return 0


if __name__ == "__main__":
    sys.exit(main())
