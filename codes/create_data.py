import pandas as pd
import numpy as np

# Generate the same sample data every time
np.random.seed(42)

number_of_deliveries = 1500

# Generate input features
distance_km = np.random.uniform(1, 15, number_of_deliveries)

preparation_time_min = np.random.randint(
    5, 31, number_of_deliveries
)

traffic_level = np.random.randint(
    1, 5, number_of_deliveries
)

weather_severity = np.random.randint(
    0, 4, number_of_deliveries
)

rider_experience_years = np.random.randint(
    0, 11, number_of_deliveries
)

# Simulate historical delivery durations
# These formulas create illustrative synthetic data.
random_delay = np.random.normal(
    0, 3, number_of_deliveries
)

delivery_time_min = (
    5
    + distance_km * 3
    + preparation_time_min
    + traffic_level * 4
    + weather_severity * 2
    - rider_experience_years * 0.4
    + random_delay
)

# Delivery duration cannot be negative
delivery_time_min = np.maximum(
    delivery_time_min, 1
)

# Create a DataFrame
data = pd.DataFrame({
    "distance_km": distance_km,
    "preparation_time_min": preparation_time_min,
    "traffic_level": traffic_level,
    "weather_severity": weather_severity,
    "rider_experience_years": rider_experience_years,
    "delivery_time_min": delivery_time_min
})

# Save the historical dataset
data.to_csv("delivery_data.csv", index=False)

print("Dataset created successfully!")
print("Total delivery records:", len(data))
print(data.head())
