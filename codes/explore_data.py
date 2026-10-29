import pandas as pd
import matplotlib.pyplot as plt

# Load the dataset
data = pd.read_csv("delivery_data.csv")

# Display the first five records
print("\nFirst five records:")
print(data.head())

# Display dataset size
print("\nDataset shape:")
print(data.shape)

# Display column names and data types
print("\nDataset information:")
data.info()

# Check for missing values
print("\nMissing values:")
print(data.isnull().sum())

# Statistical summary
print("\nStatistical summary:")
print(data.describe())

# Check correlation with delivery time
print("\nCorrelation with delivery time:")
print(data.corr()["delivery_time_min"].sort_values(
    ascending=False
))

# Plot distance against delivery time
plt.scatter(
    data["distance_km"],
    data["delivery_time_min"]
)

plt.xlabel("Distance (km)")
plt.ylabel("Delivery time (minutes)")
plt.title("Distance vs Delivery Time")
plt.grid(True)
plt.show()
