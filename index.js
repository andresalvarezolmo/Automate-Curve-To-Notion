require('dotenv').config()
const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const csv = require('csv-parser');
const fs = require('fs');
const axios = require('axios');
const dt = require('luxon').DateTime;

const getRates = async () => {
  let response = await axios.get(`${process.env.CURRENCY_API_URL}${process.env.CURRENCY_API_KEY}${process.env.CURRENCY_API_END}`)
  return response.data.conversion_rates
}

const addEntry =  async (expense, amount, category, date) => {
  const response = await notion.pages.create({
    "parent": {
      "type": "database_id",
      "database_id": process.env.NOTION_DATABASE_ID
    },
    "properties": {
      "Expense": {
        "title": [
          {
            "type": "text",
            "text": {
              "content": expense
            }
          }
        ]
      },
      "Amount": {
        "number": amount
      },
      "Category": {
        "multi_select": [
          {
            "name": category
          }
        ]
      },
      "Date": {
        "date": {
          "start": date
        }
      }
    }
  });
  console.log(response);
}

const filename = process.argv[2]

const readfile = async () => {
  const rates = await getRates()
  fs.createReadStream(filename)
  .pipe(csv())
  .on('data', (row) => {
    try{  
      if(row['Type'] !== "Declined" && row['Type'] !== "REFUNDED" && row['Type'] !== "PENDING"){
        let amount = 0
        const currency = row[' Txn Currency (Funding Card)'].replace(/\s/g, '');
        // const date = dt.fromFormat(row['Date (YYYY-MM-DD as UTC)'], "D").toISODate();
        // const date = dt.fromISO(row[' Date (YYYY-MM-DD as UTC)']).toISODate()
        const date = row[' Date (YYYY-MM-DD as UTC)'].replace(/\s/g, '');
        if (currency == "GBP"){
          amount = row[" Txn Amount (Funding Card)"]
        } 
        else {
          amount = row[" Txn Amount (Funding Card)"]/rates[currency]
        }
        amount = Math.round(amount*100)/100
        // console.log(row['Merchant'], amount, row['Category'], date)
        const title = row[' Merchant'].replace(/\s/g, '').replace(/['"]+/g, '');
        const category = row[' Category'].replace(/\s/g, '');
        // console.log(title, amount, category , date);
        addEntry(title, amount, category , date);
      }
    }catch(error){
      console.log(error)
    }
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
  });
}

readfile()
