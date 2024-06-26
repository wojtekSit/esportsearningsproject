import requests
from bs4 import BeautifulSoup
import pandas as pd

# Dictionary mapping inconsistent names to correct names
name_mappings = {
    "United States": "United States of America",
    "Korea, Republic of": "Republic of Korea",
    "Taiwan, Republic of China": "Taiwan",
    "United Kingdom": "U.K. of Great Britain and Northern Ireland",
    "Viet Nam": "Vietnam",
    "Bosnia and Herzegovina": "Bosnia & Herzegovina",
    "Iran, Islamic Republic of": "Iran (Islamic Republic of)",
    "North Macedonia": "The former Yugoslav Republic of Macedonia",
    "Palestine, State of": "Gaza Strip",
    "Côte D'Ivoire": "Côte d'Ivoire"
}

def scrape_and_save_data(year):
    url = f"https://www.esportsearnings.com/history/{year}/countries"
    filename = f"EsportsEarningsData/esport_earnings_{year}.xlsx"
    response = requests.get(url)
    if response.status_code == 200:
        soup = BeautifulSoup(response.content, "html.parser")
        # Find the table containing the data
        table = soup.find("table", {"class": "detail_list_table"})
        if table:
            # Define headers
            headers = ["Order", "Country", "Prize", "Number of Players"]


            # # Extracting header row
            # header_row = [header.text.strip() for header in table.find("tr").find_all("th")]
            # # Extracting data rows
            # rows = []
            # for row in table.find_all("tr")[1:]:
            #     row_data = [data.text.strip() for data in row.find_all("td")]
            #     # Replace inconsistent names with correct names
            #     row_data[1] = name_mappings.get(row_data[1], row_data[1])
            #     rows.append(row_data)

            # Extracting rows
            rows = []
            for row in table.find_all("tr")[0:]:
                row_data = [data.text.strip() for data in row.find_all("td")]
                row_data[1] = name_mappings.get(row_data[1], row_data[1])
                rows.append(row_data)

            # Create a pandas DataFrame
            df = pd.DataFrame(rows, columns=headers)
            # Save DataFrame to Excel
            df.to_excel(filename, index=False)
            print(f"Data saved to {filename}")
        else:
            print("Table not found on the webpage.")
    else:
        print(f"Failed to retrieve the webpage for year {year}. Status code:", response.status_code)

# List of years to scrape
years = [2024, 2023, 2022, 2021, 2020]

# Iterate over years and scrape data
for year in years:
    scrape_and_save_data(year)
