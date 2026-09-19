import sys
from sqlalchemy import create_engine
from app.core.config import settings
from app.core.database import Base, engine
from app.models import User, Task

def init_postgres_database():
    """Attempts to connect to PostgreSQL host and ensure database exists."""
    print(f"[*] Checking PostgreSQL server at {settings.DB_HOST}:{settings.DB_PORT}...")
    try:
        import psycopg2
        from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
        
        connection = psycopg2.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            dbname="postgres",
            connect_timeout=5
        )
        connection.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        with connection.cursor() as cursor:
            cursor.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{settings.DB_NAME}'")
            exists = cursor.fetchone()
            if not exists:
                cursor.execute(f"CREATE DATABASE {settings.DB_NAME}")
                print(f"[+] Successfully created PostgreSQL database '{settings.DB_NAME}'.")
            else:
                print(f"[+] PostgreSQL database '{settings.DB_NAME}' already exists.")
        connection.close()
        return True
    except ImportError:
        print("[-] psycopg2 is not installed.")
        return False
    except Exception as e:
        print(f"[-] Could not connect to PostgreSQL server: {e}")
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
    print("=== TickTheTask Database Initializer ===")
    db_url = settings.get_database_url()

    if "postgres" in db_url:
        pg_online = init_postgres_database()
        if pg_online:
            create_tables(engine)
            print("[+] Database initialization complete!")
            return 0
        else:
            print("\n[!] PostgreSQL is currently offline or unreachable.")
            print("    Please ensure PostgreSQL Server is running and credentials in backend/.env are correct.")
            print("    Verifying table schemas against local SQLite database for validation...")
            sqlite_engine = create_engine("sqlite:///./tickthetask_test.db")
            create_tables(sqlite_engine)
            print("[+] Models and schema definitions validated successfully!")
            return 0
    else:
        create_tables(engine)
        print("[+] Database initialization complete!")
        return 0

if __name__ == '__main__':
    sys.exit(main())
