import fs from "fs";
import puppeteer from "puppeteer";

const filePath = "data.json";

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(
    "https://www.gs1.org/services/verified-by-gs1/results?gtin=8904355402989",
    { waitUntil: "networkidle2" }
  );

  try {
    await page.waitForSelector("#onetrust-accept-btn-handler", {
      visible: true,
      timeout: 5000,
    });
    console.log("Button is present and visible.");

    await page.evaluate(() => {
      const btn = document.querySelector("#onetrust-accept-btn-handler");
      if (btn) {
        btn.click();
      }
    });

    await page.waitForSelector(".btn-accept", {
      visible: true,
      timeout: 5000,
    });
    console.log("Button is present and visible -1.");

    await page.evaluate(() => {
      const btn = document.querySelector(".btn-accept");
      if (btn) {
        btn.click();
      }
    });

    console.log("Accepted cookies.");

    await page.waitForSelector(".row.mb-spacer-2", {
      visible: true,
      timeout: 5000,
    });

    const content = await page.evaluate(() => {
      const data = {};

      const heading = document
        .querySelector(".row.mb-spacer-2 h3")
        ?.innerText.trim();
      data.heading = heading;

      const img = document
        .querySelector(".row.mb-spacer-2 .product-image img")
        ?.src.trim();
      data.img = img;

      const rows = document.querySelectorAll(".company tbody tr");
      rows.forEach((row) => {
        const key = row.querySelector("td:first-child")?.innerText.trim();
        if (key === "Product image URL") {
          const values = [];
          const strongText = row.querySelector("td strong")?.innerText.trim();
          const linkHref = row.querySelector("td a")?.href.trim();
          if (strongText) values.push(strongText);
          if (linkHref) values.push(linkHref);
          data[key] = values;
        } else {
          const value = row.querySelector("td strong")?.innerText.trim();
          if (key && value) {
            data[key] = value;
          }
        }
      });

      return data;
    });

    console.log("Extracted data:", content);

    // Check if the file exists
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const existingData = JSON.parse(fileContent);

      existingData.push(content);
      fs.writeFileSync(
        filePath,
        JSON.stringify(existingData, null, 2),
        "utf-8"
      );
      console.log("Data appended to data.json:", existingData);
    } else {
      const newData = [content];
      fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), "utf-8");
      console.log("File created and first product added:", newData);
    }
  } catch (err) {
    console.error("Error interacting with the page:", err);
  }
  // finally {
  //   await browser.close();
  // }
})();
