# Import dependencies
from openai import OpenAI
from dotenv import load_dotenv
import json
import pyodbc
import pandas as pd
import os


# Generates a SQL query using OpenAI API for a user request
def get_query(request_usr_val):
    # Load environment variables from .env
    load_dotenv()

    # Gets the OpenAI API key
    client = OpenAI()

    # System message for the OpenAI model
    # Give how the model should assist
    content_system = "You are a helpful assistant designed to output a t-sql query in JSON. Always generate a JSON object with a key-value pair format {'query': 'value'}."

    # User message for the OpenAI model
    # Gives the user request with the background explanation
    user_req_1 = "SQL dialect is T-SQL. This is a data warehouse for sales data. Data warehouse is in star schema."
    user_req_2 = "There is one fact table as [DWH_Fact].[FactSales] which contains sales data."
    user_req_3 = "There are three dimension tables as [DWH_Dim].[DimCustomer] - contains customer data, [DWH_Dim].[DimDate] - contains date data, [DWH_Dim].[DimProduct] - contains product data."
    user_req_4 = "Schema of [DWH_Fact].[FactSales] fact tables is [CustomerSK] [int], [ProductSK] [int], [DateSK] [int], [SalesOrderId] [varchar], [LineItemId] [varchar], [Quantity] [float], [UnitPrice] [float], [TotalAmount] [float], [Status] [varchar], [DateInserted] [date], [HashValue] [varbinary]."
    user_req_5 = "Schema of [DWH_Dim].[DimCustomer] dimension table is [CustomerSK] [int], [Name] [varchar], [Phone] [varchar], [AddressLine1] [varchar], [AddressLine2] [varchar], [City] [varchar], [State] [varchar], [PostalCode] [varchar], [Country] [varchar], [DateInserted] [date]."
    user_req_6 = "Schema of [DWH_Dim].[DimDate] dimension table is [DateSK] [int], [Date] [date], [Year] [int], [Month] [int], [Day] [int], [DateInserted] [date]."
    user_req_7 = "Schema of [DWH_Dim].[DimProduct] dimension table is [ProductSK] [int], [Code] [varchar], [Name] [varchar], [DateInserted] [date]."
    user_req_8 = "[DWH_Fact].[FactSales] can be joined with [DWH_Dim].[DimCustomer] using [CustomerSK]."
    user_req_9 = "[DWH_Fact].[FactSales] can be joined with [DWH_Dim].[DimDate] using [DateSK]."
    user_req_10 = "[DWH_Fact].[FactSales] can be joined with [DWH_Dim].[DimProduct] using [ProductSK]."    
    content_user = f"{user_req_1} {user_req_2} {user_req_3} {user_req_4} {user_req_5} {user_req_6} {user_req_7} {user_req_8} {user_req_9} {user_req_10} Give a t-sql query to the request : {request_usr_val}"

    # Gets the SQL query from the OpenAI model based on the user request
    response = client.chat.completions.create(
        model="gpt-3.5-turbo-1106",
        response_format={ "type": "json_object" },
        messages=[
            {"role": "system", "content": f"{content_system}"},
            {"role": "user", "content": f"{content_user}"}
        ]
    )

    # Gets the response, do requred transformations to extract the query and returns the query
    response_text = response.choices[0].message.content
    json_object = json.loads(response_text)
    key, query = next(iter(json_object.items()))
    return query


# Runs a SQL query against the data warehouse and returns the reponse
def get_dwh_result(query):
    # Details requred to execute a SQL query in the data warehouse (Azure Dedicated SQL Pool)
    # Username and password are extracted from the .env file
    server = 'heshtestdwhserver.database.windows.net'
    database = 'heshtestdwhdatawarehouse'
    username = os.getenv("WAREHOUSE_USR")
    password = os.getenv("WAREHOUSE_PWD")
    driver= '{ODBC Driver 17 for SQL Server}'

    # Runs the SQL query against the data warehouse and returns the reponse
    with pyodbc.connect('DRIVER='+driver+';SERVER=tcp:'+server+';PORT=1433;DATABASE='+database+';UID='+username+';PWD='+ password) as conn:
        with conn.cursor() as cursor:
            cursor.execute(query)

            # Gets the column names from the description attribute
            column_names = [column[0] for column in cursor.description]
            
            # Creates an empty DataFrame with column names
            df = pd.DataFrame(columns=column_names)

            # Access each row one-by-one
            row = cursor.fetchone()
            while row:
                row_data = {}
                
                # Access individual columns of the row by index
                for i in range(len(column_names)):
                    # Appends a row to row_data dictionary
                    row_data[column_names[i]] = row[i]
                
                # Appends each finalized row to the data frame and moves to the next row
                df = df._append(row_data, ignore_index=True)
                row_data.clear()
                row = cursor.fetchone()

            # Converts the DataFrame to JSON format and returns the response
            json_response = df.to_json(orient='records')
            return json_response