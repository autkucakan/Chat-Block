# Database Migrations with Alembic

This project uses Alembic for managing database schema migrations for PostgreSQL.

## Basic Commands

### Check Migration Status

To see the current migration version:

```bash
alembic current
```

### Create a New Migration

When you make changes to your SQLAlchemy models in `app/models.py`, you need to create a new migration to apply those changes to the database.

```bash
alembic revision --autogenerate -m "Description of the changes"
```

### Apply Migrations

To upgrade the database to the latest version:

```bash
alembic upgrade head
```

To upgrade to a specific version:

```bash
alembic upgrade <revision_id>
```

### Downgrade Migrations

To downgrade to a previous version:

```bash
alembic downgrade <revision_id>
```

To downgrade one revision:

```bash
alembic downgrade -1
```

### View Migration History

To see the migration history:

```bash
alembic history
```

## Tips for Working with Alembic

1. **Always review generated migrations** before applying them. Alembic's autogenerate feature is powerful but may not catch all types of schema changes correctly.

2. **Test migrations** in a development environment before applying them to production.

3. **Make small, incremental changes** to your database schema to minimize migration complexity and reduce the risk of errors.

4. **Back up your database** before applying significant migrations.

5. **Use meaningful descriptions** when creating new migrations to make it easier to understand changes in the future.

## Project Configuration

- The Alembic configuration is defined in `alembic.ini`
- Migration scripts are stored in the `migrations/versions` directory
- The database connection string is loaded from `app/database.py` 