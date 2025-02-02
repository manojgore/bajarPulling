const puppeteer = require('puppeteer');
const db = require('../db');
const baseURL = 'https://www.msamb.com/ApmcDetail/APMCPriceInformation';

const scarpingWeb = (marketTypes, ws, marketTypesDetails) => {
  try {
    marketTypes.forEach( (marketType, index) => {
      const marketTypeData = marketTypesDetails[marketType];
      marketTypeData.DropdownOptions.forEach(async (option)=>{

        ws.send(JSON.stringify({status : "info" , message : `Launching browser for Market Type : ${marketType}, Name : ${option.name}, Code: ${option.code}`}));
        const browser = await puppeteer.launch();
        ws.send(JSON.stringify({status : "info" , message : `Launching web page for Market Type : ${marketType}, Name : ${option.name}, Code: ${option.code}`}));
        const page = await browser.newPage();

        const URL = baseURL + `#${marketType}`;
        ws.send(JSON.stringify({status : "info" , message : `Loading into ${URL} Market Type : ${marketType}, Name : ${option.name}, Code: ${option.code}`}));
        await page.goto(URL, { waitUntil: 'domcontentloaded' });

        // updaing language
        const changingLanguage = await page.evaluate(async() => {
          const selectElement = document.getElementById('language');
          if (selectElement) {
            selectElement.value = 'मराठी';
            const event = new Event('change', { bubbles: true });
            selectElement.dispatchEvent(event);
            return `Updated language to मराठी`;
          }
          return `Did not found language dropdown`;
        });
        ws.send(JSON.stringify({status : "info" , message : `${changingLanguage}`}));

        await new Promise((resolve) => setTimeout(resolve, 2000));
        // switching tabs
        const switchingTab = await page.evaluate(async(marketTypeData, option) => {
          const selectElement = document.getElementById(marketTypeData.subTabID);
          if (selectElement) {
            selectElement.click();
            await new Promise((resolve) => setTimeout(resolve, 2000));
            return `Switching tab for ${marketTypeData.subTabID} Market Type : ${marketTypeData.name}, Name : ${option.name}, Code: ${option.code}`;
          }
          return `ID not found for ${marketTypeData.subTabID}`;
        }, marketTypeData, option);

        ws.send(JSON.stringify({status : "info" , message : `${switchingTab}`}));
        ws.send(JSON.stringify({status : "info" , message : `Market Type : ${marketType}, Name : ${option.name}, Code: ${option.code}`}));
        ws.send(JSON.stringify({status : "info" , message : `Scarping Data for ${marketTypeData.name}`}));

        // updating select drowdown
        const manipulationResult = await page.evaluate(async(marketTypeData, option) => {
          const selectElement = document.getElementById(marketTypeData.SelectOptionId);
          if (selectElement) {
            const optionsList = [...selectElement.options].map(opt => opt.value);
            if (optionsList.includes(option.code)) {
              selectElement.value = option.code;
            } else {
              let string = optionsList.map(opt => { return  " '"+ `${opt}` + "'" });
              return `Invalid option code: ${option.code} availble options ${string}`; 
            }
            let valueOFSelect = selectElement.value;
            const event = new Event('change', { bubbles: true });
            selectElement.dispatchEvent(event);
    
            return `Dropdown value updated and onchange triggered for valueOFSelect : ${valueOFSelect} Market Type : ${marketTypeData.name}, Name : ${option.name}, Code: ${option.code}, option : ${marketTypeData.SelectOptionId}`;
          }
          return `Dropdown not found for ${marketTypeData.name}`;
        }, marketTypeData, option);
        
        ws.send(JSON.stringify({status : "info" , message : manipulationResult}));
        ws.send(JSON.stringify({status : "info" , message : `Waiting for 2 Seconds Market Type : ${marketTypeData.name}, Name : ${option.name}, Code: ${option.code}`}));

        await new Promise((resolve) => setTimeout(resolve, 2000));

        ws.send(JSON.stringify({status : "info" , message : `Started extracting data for Market Type : ${marketTypeData.name}, Name : ${option.name}, Code: ${option.code}`}));

        const data = await page.evaluate((marketTypeData) => {
          const items = document.getElementById(marketTypeData.tableId);
          return items ? items.outerHTML : null;
        }, marketTypeData);

        if (!data) {
          ws.send(JSON.stringify({status : "error" , message : `No data found in ${marketTypeData.name} - ${option.name}`}));
          // need to handle if data is null
        }
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD

        const checkQuery = `SELECT * FROM ${marketTypeData.tableName} WHERE code = ? AND DATE(date) = ?`;
       
        db.query(checkQuery, [option.code, formattedDate], (err, results) => {
            if (err) {
                console.log(err);
                ws.send(JSON.stringify({status : "info" , message : `Error while checking record in table: ${marketTypeData.tableName}`}));
                return;
            }

            if (results.length === 0) {
                // **No record found, INSERT new row**
                const insertQuery = `INSERT INTO ${marketTypeData.tableName} (table_data, date, code, last_update) VALUES (?, ?, ?, ?)`;

                db.query(insertQuery, [JSON.stringify(data), formattedDate, option.code, today], (err, result) => {
                    if (err) {
                        console.log(err);
                        ws.send(JSON.stringify({status : "error" , message : `Error while inserting into ${marketTypeData.tableName}`, data : {Section :marketTypeData.name, Name : option.name, Code : option.code}}));
                    } else {
                        ws.send(JSON.stringify({status : "insert" , message : `Inserted into ${marketTypeData.tableName}, Name: ${option.name}, Code: ${option.code}, Insert Id: ${result.insertId}`, data : {Section :marketTypeData.name, Name : option.name, Code : option.code}}));
                    }
                });

            } else {
                // **Record exists, UPDATE the existing row**
                const updateQuery = `UPDATE ${marketTypeData.tableName} SET table_data = ?, last_update = ? WHERE code = ? AND DATE(date) = ?`;

                db.query(updateQuery, [JSON.stringify(data), today, option.code, formattedDate], (err, result) => {
                    if (err) {
                        console.log(err);
                        ws.send(JSON.stringify({status : "error" , message :`Error while updating ${marketTypeData.tableName}`, data : {Section :marketTypeData.name, Name : option.name, Code : option.code}}));
                    } else {
                        ws.send(JSON.stringify({status : "update" , message :`Updated ${marketTypeData.tableName}, Name: ${option.name}, Code: ${option.code}`, data : {Section :marketTypeData.name, Name : option.name, Code : option.code}}));
                    }
                });
            }
        });


        await browser.close();
      })
    });
    
   
  } catch (error) {
    ws.send(JSON.stringify('Error during scraping:', error.message));
    console.error('Error during scraping:', error.message);
  }
};

module.exports = scarpingWeb;