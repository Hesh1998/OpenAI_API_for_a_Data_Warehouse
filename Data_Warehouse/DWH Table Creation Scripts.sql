-- Creates 2 Schemas for Dimension and Fact tables
CREATE SCHEMA DWH_Dim;
CREATE SCHEMA DWH_Fact;


-- Creates Customer dimension table
CREATE TABLE [DWH_Dim].[DimCustomer]
(
	[CustomerSK] [int] IDENTITY(1,1) NOT NULL, -- Auto inserts a unique CustomerSK for each entry
	[Name] [varchar](50) NOT NULL,
	[Phone] [varchar](20) NOT NULL,
	[AddressLine1] [varchar](50) NOT NULL,
	[AddressLine2] [varchar](50) NULL,
	[City] [varchar](50) NOT NULL,
	[State] [varchar](50) NULL,
	[PostalCode] [varchar](20) NULL,
	[Country] [varchar](50) NOT NULL,
	[DateInserted] [date] NOT NULL -- The insertion date of the record
)
WITH
(
	DISTRIBUTION = REPLICATE -- Replicate distribution used for dimension tables
)
GO


-- Creates Product dimension table
CREATE TABLE [DWH_Dim].[DimProduct]
(
	[ProductSK] [int] IDENTITY(1,1) NOT NULL, -- Auto inserts a unique ProductSK for each entry
	[Code] [varchar](20) NOT NULL,
	[Name] [varchar](50) NOT NULL,
	[DateInserted] [date] NOT NULL -- The insertion date of the record
)
WITH
(
	DISTRIBUTION = REPLICATE -- Replicate distribution used for dimension tables
)
GO


-- Creates Date dimension table
CREATE TABLE [DWH_Dim].[DimDate]
(
	[DateSK] [int] IDENTITY(1,1) NOT NULL, -- Auto inserts a unique DateSK for each entry
	[Date] [date] NOT NULL,
	[Year] [int] NOT NULL,
	[Month] [int] NOT NULL,
	[Day] [int] NOT NULL,
	[DateInserted] [date] NOT NULL -- The insertion date of the record
)
WITH
(
	DISTRIBUTION = REPLICATE -- Replicate distribution used for dimension tables
)
GO


-- Multi-column distribution in Azure Synapse Analytics can be enabled by changing the database's compatibility level to 50
-- This is important to create [DWH_Fact].[FactSales] with DISTRIBUTION = HASH ([SalesOrderId], [LineItemId])
ALTER DATABASE SCOPED CONFIGURATION SET DW_COMPATIBILITY_LEVEL = 50;


-- Creates Sales fact table
-- [SalesOrderId] + [LineItemId] combination gives a unique row
CREATE TABLE [DWH_Fact].[FactSales]
(
	[CustomerSK] [int] NOT NULL,
	[ProductSK] [int] NOT NULL,
	[DateSK] [int] NOT NULL,
	[SalesOrderId] [varchar](20) NOT NULL,
	[LineItemId] [varchar](10) NOT NULL,
	[Quantity] [float] NOT NULL,
	[UnitPrice] [float] NOT NULL,
	[TotalAmount] [float] NOT NULL,
	[Status] [varchar](20) NOT NULL,
	[DateInserted] [date] NOT NULL, -- The insertion date of the record
	[HashValue] [varbinary](8000) NULL  -- Used to uniquely identify a record, generated based on [SalesOrderId] + [LineItemId] combination
)
WITH
(
	DISTRIBUTION = HASH ([SalesOrderId], [LineItemId]) -- Hash distribution used for fact table with combined unique columns [SalesOrderId], [LineItemId]
)
GO