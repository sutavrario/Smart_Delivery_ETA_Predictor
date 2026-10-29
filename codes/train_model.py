import pandas as pd
import pickle

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)

# STEP 1: Load the dataset
data = pd.read_csv("delivery_data.csv")

# STEP 2: Select input features
X = data[
    [
        "distance_km",
        "preparation_time_min",
        "traffic_level",
        "weather_severity",
        "rider_experience_years"
    ]
]

# STEP 3: Select the target
y = data["delivery_time_min"]

# STEP 4: Split data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42
)

print("Training records:", len(X_train))
print("Testing records:", len(X_test))

# STEP 5: Create the Linear Regression model
model = LinearRegression()

# STEP 6: Train the model
model.fit(X_train, y_train)

print("\nModel training completed!")

# STEP 7: Predict using test data
y_pred = model.predict(X_test)

# STEP 8: Evaluate the model
mae = mean_absolute_error(y_test, y_pred)
mse = mean_squared_error(y_test, y_pred)
rmse = mse ** 0.5
r2 = r2_score(y_test, y_pred)

print("\nMODEL EVALUATION RESULTS")
print("------------------------")
print("MAE:", round(mae, 2), "minutes")
print("MSE:", round(mse, 2))
print("RMSE:", round(rmse, 2), "minutes")
print("R2 Score:", round(r2, 4))

# STEP 9: Display learned coefficients
print("\nLEARNED COEFFICIENTS")

for feature, coefficient in zip(
    X.columns, model.coef_
):
    print(feature, ":", round(coefficient, 3))

print("Intercept:", round(model.intercept_, 3))

# STEP 10: Save the trained model and feature names
model_package = {
    "model": model,
    "features": list(X.columns)
}

with open("Rio.pkl", "wb") as file:
    pickle.dump(model_package, file)

print("\nModel saved successfully!")
print("File created: Rio.pkl")

