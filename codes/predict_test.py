import pandas as pd
import pickle

# STEP 1: Load the saved model
with open("Rio.pkl", "rb") as file:
    model_package = pickle.load(file)

model = model_package["model"]
features = model_package["features"]

print("Saved model loaded successfully!")

# STEP 2: Enter details for a new delivery
distance_km = float(input("Enter distance in km: "))

preparation_time_min = float(
    input("Enter food preparation time in minutes: ")
)

traffic_level = int(
    input("Enter traffic level (1-4): ")
)

weather_severity = int(
    input("Enter weather severity (0-3): ")
)

rider_experience_years = float(
    input("Enter rider experience in years: ")
)

# STEP 3: Prepare input in the correct column order
new_delivery = pd.DataFrame(
    [[
        distance_km,
        preparation_time_min,
        traffic_level,
        weather_severity,
        rider_experience_years
    ]],
    columns=features
)

# STEP 4: Predict the delivery time
predicted_time = model.predict(new_delivery)[0]

# STEP 5: Display the result
print("\nDELIVERY PREDICTION")
print("-------------------")
print(
    "Estimated delivery time:",
    round(max(0, predicted_time), 1),
    "minutes"
)
