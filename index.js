require('dotenv').config()

const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_API_KEY });
(async () => {
  const databaseId = "84f4ef6fc0fa402baed0a16fd828b8f9";
  // const response = await notion.databases.retrieve({ database_id: databaseId });
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: 'Expense',
      title: {
        equals: "ice cream"
      }
    }
  })
  console.log(response);
})();


