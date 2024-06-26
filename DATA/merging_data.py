import pandas as pd


df1 = pd.read_excel('X:/WebGIS/EsportsEarnings/esports_data.xlsx')  
df2 = pd.read_excel('X:/WebGIS/EsportsEarnings/world-administrative-boundaries.xlsx')  

merged_df = pd.merge(df1, df2, on='Country', how='inner')

merged_df.to_csv('merged_dataset.csv', index=False)

print("Merged dataset saved successfully.")
