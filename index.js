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

readfile = async () => {
  const rates = await getRates()
  fs.createReadStream('export.csv')
  .pipe(csv())
  .on('data', (row) => {
    try{  
      let amount = 0
      const currency = row['Txn Currency (Funding Card)']

      if(row['Type'] !== "Declined" && row['Type'] !== "REFUNDED" && row['Type'] !== "PENDING"){
        // console.log(row['Merchant'])
        const date = dt.fromFormat(row['Date (YYYY-MM-DD as UTC)'], "D").toISODate();

        if (currency == "GBP"){
          amount = -row['Txn Amount (Funding Card)']
        } 
        else {
          amount = -row['Txn Amount (Funding Card)']/rates[currency]
        }
        addEntry(row['Merchant'], amount, row['Category'], date)
      }
    }catch(error){
      console.log(error)
    }
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
  });
}

addEntry =  async (expense, amount, category, date) => {
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

readfile()

// addEntry("Expense from script", 10, "Food", "2021-05-11T11:00:00.000-04:00")


// (async () => {
//   // const response = await notion.databases.retrieve({ database_id: databaseId });
//   const response = await notion.databases.query({
//     database_id: databaseId,
//     filter: {
//       property: 'Expense',
//       title: {
//         equals: "Experiment from script"
//       }
//     }
//   })
//   console.log(response);
// })();


// (async () => {
//   const pageId = '562fb2f1-dc93-4997-9f6d-2fb057fa0436';
//   const propertyId = "Amount"
//   const response = await notion.pages.properties.retrieve({ page_id: pageId, property_id: propertyId });
//   console.log(response);
// })();

