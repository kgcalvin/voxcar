# Scripts Documentation

## Add Grouped Features Script

This script processes all existing car listings in the database and adds grouped features using the NLP service.

### What it does:

1. **Fetches all cars** from the database in batches of 100
2. **Processes each car's description** using the NLP service to extract features
3. **Groups features** into categories:
   - Performance
   - Safety
   - Comfort
   - Technology
   - Exterior
   - Interior trim
   - Economy
   - Drivetrain
   - Certification
4. **Updates each car** with the grouped features
5. **Skips cars** that already have grouped features
6. **Provides progress logging** and error handling

### Prerequisites:

1. **Database migration**: Run the SQL migration to add the `grouped_features` column
2. **NLP service**: Must be properly configured with entity groups
3. **Environment variables**: Database connection must be configured

### Database Migration:

Before running the script, you need to add the `grouped_features` column to your database:

```sql
-- Run this SQL command in your MySQL database
ALTER TABLE car_listings
ADD COLUMN grouped_features JSON NULL;

-- Optional: Add an index for better performance
CREATE INDEX idx_car_listings_grouped_features ON car_listings ((JSON_EXTRACT(grouped_features, '$')));
```

Or use the provided migration script:

```bash
mysql -u your_username -p your_database < scripts/add-grouped-features-column.sql
```

### How to run:

```bash
# Run the script
pnpm run add-grouped-features
```

### Expected output:

```
[AddGroupedFeatures] Starting to add grouped features to existing cars...
[AddGroupedFeatures] Fetching cars from database...
[AddGroupedFeatures] Total cars to process: 1500
[AddGroupedFeatures] Processing batch 1/15 (100 cars)
[AddGroupedFeatures] Progress: 50/1500 cars processed, 48 updated, 2 errors
[AddGroupedFeatures] Processing batch 2/15 (100 cars)
...
[AddGroupedFeatures] === PROCESSING COMPLETE ===
[AddGroupedFeatures] Total cars processed: 1500
[AddGroupedFeatures] Cars updated: 1450
[AddGroupedFeatures] Errors encountered: 50
Script completed successfully
```

### Performance considerations:

- **Batch processing**: Processes 100 cars at a time to avoid memory issues
- **Skip existing**: Won't reprocess cars that already have grouped features
- **Error handling**: Continues processing even if individual cars fail
- **Progress logging**: Shows progress every 50 cars
- **Small delays**: 100ms delay between batches to avoid overwhelming the system

### Troubleshooting:

1. **Database connection issues**: Check your `.env` file and database connectivity
2. **NLP service errors**: Ensure `entity-groups.json` is properly configured
3. **Memory issues**: Reduce batch size in the script if needed
4. **Timeout issues**: The script can take a while for large databases

### Example grouped features output:

```json
{
  "grouped_features": {
    "performance": ["turbo charger", "V6 engine"],
    "safety": ["backup camera", "blind spot monitor", "airbags"],
    "comfort": ["heated seats", "leather interior"],
    "technology": ["apple carplay", "bluetooth"],
    "exterior": ["alloy wheels", "rear spoiler"],
    "interior_trim": ["wood trim", "aluminum accents"],
    "economy": ["fuel efficient", "hybrid"],
    "drivetrain": ["AWD", "4x4"],
    "certification": ["clean carfax", "certified pre-owned"]
  }
}
```

### Notes:

- This script is designed to be run **once** to populate existing data
- New cars will get grouped features during the scraping process
- The script is idempotent - safe to run multiple times
- Monitor the logs for any errors or issues during processing
