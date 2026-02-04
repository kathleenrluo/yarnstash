# Database Migrations

This folder contains one-time migration scripts for database schema changes.

## Migration Scripts

All migrations in this folder have been completed. They are kept for reference and historical purposes.

### `add_materials_column.py`
Adds the `materials` JSON column to the `yarns` table. This was needed because SQLAlchemy's `create_all()` only creates new tables, not new columns.

**Status**: ✅ Completed

### `update_materials.py`
Parses `material_breakdown` strings for all existing yarns and populates the `materials` JSON array field.

**Status**: ✅ Completed

### `add_notes_to_yarns.py`
Adds the `notes` TEXT column to the `yarns` table to allow users to store additional notes about their yarns.

**Status**: ✅ Completed

### `add_unique_constraint_yarns.py`
Adds a unique constraint on `(brand_name, yarn_name, color_name)` to the `yarns` table to prevent duplicate yarn entries at the database level. This provides an additional layer of protection beyond the service-level duplicate check.

**Status**: ⚠️ Run if you have existing data (checks for duplicates first)

## Usage

These scripts are one-time migrations. They should only be run if you have an existing database that needs to be updated. For new databases, the schema is created automatically when you start the backend.

## Future Migrations

For future schema changes, consider using Alembic for proper database migration management.
