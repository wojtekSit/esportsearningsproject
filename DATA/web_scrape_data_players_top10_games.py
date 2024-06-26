import requests
from bs4 import BeautifulSoup
import pandas as pd

# Dictionary mapping game IDs to their names
game_ids_and_names = {
    231: "dota-2",
    554: "playerunknowns-battlegrounds-mobile",
    534: "fortnite",
    529: "arena-of-valor",
    245: "counter-strike-global-offensive",
    439: "rainbow-six-siege",
    409: "rocket-league",
    164: "league-of-legends",
    504: "playerunknowns-battlegrounds",
    151: "starcraft-ii"
}

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

def scrape_and_save_data(year, game_id, game_name):
    url = f"https://www.esportsearnings.com/history/{year}/games/{game_id}-{game_name}"
    filename = f"EsportsEarningsData/esports_earnings_{game_name}_{year}.csv"
    response = requests.get(url)
    if response.status_code == 200:
        soup = BeautifulSoup(response.content, "html.parser")
        # Find the table containing the data
        table = soup.find("table", {"class": "detail_list_table"})
        if table:
            # Define headers
            headers = ["Order", "Player ID", "Player Name", "Country", "Total earnings(year)", "Total Earnings(game)", "Percentage of Game", "Total(Overall)", "Percentage of Total"]
            # Extracting rows
            rows = []
            for row in table.find_all("tr")[1:]:
                row_data = [data.text.strip() for data in row.find_all("td")]
                # Extracting country from the player's name cell
                country_img = row.find("td", {"class": "detail_list_player"}).find("img")
                country = country_img.get("alt", "") if country_img else ""
                # Replace inconsistent country names with correct names
                country = name_mappings.get(country, country)
                # Replace inconsistent player names with correct names
                row_data[2] = name_mappings.get(row_data[2], row_data[2])
                # Append country to row data
                row_data.insert(3, country)
                rows.append(row_data)
            # Create a pandas DataFrame
            df = pd.DataFrame(rows, columns=headers)
            # Save DataFrame to CSV
            df.to_csv(filename, index=False)
            print(f"Data saved to {filename}")
        else:
            print("Table not found on the webpage.")
    else:
        print(f"Failed to retrieve the webpage for year {year}. Status code:", response.status_code)

# List of years to scrape
years = [2024, 2023, 2022, 2021, 2020]

# Iterate over years and game IDs and scrape data
for year in years:
    for game_id, game_name in game_ids_and_names.items():
        scrape_and_save_data(year, game_id, game_name)
