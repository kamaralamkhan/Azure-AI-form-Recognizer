document
  .getElementById("upload-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const apiKey = "403271e6f11d44e7803450bd3e7ec762";
    const apiUrl =
      "https://formrecognizerbill.cognitiveservices.azure.com//formrecognizer/documentModels/foodbill1:analyze?api-version=2023-07-31";

    const imageInput = document.getElementById("image-input");
    if (!imageInput.files || imageInput.files.length === 0) {
      alert("Please select an image file.");
      return;
    }

    const imageFile = imageInput.files[0];

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": apiKey,
          "Content-Type": "application/octet-stream",
        },
        body: imageFile,
      });

      if (response.ok) {
        const operationLocation = response.headers.get("Operation-Location");
        document.getElementById(
          "result"
        ).innerHTML = `Operation Location: ${operationLocation}`;
        await waitForAnalysisResultAndSave(operationLocation, imageFile); // Pass imageFile as a parameter
      } else {
        const errorText = await response.text();
        document.getElementById("result").innerHTML = `Error: ${errorText}`;
      }
    } catch (error) {
      document.getElementById(
        "result"
      ).innerHTML = `An error occurred: ${error.message}`;
    }
  });

async function waitForAnalysisResultAndSave(operationLocation, imageFile) {
  const apiKey = "403271e6f11d44e7803450bd3e7ec762";

  try {
    while (true) {
      const response = await fetch(operationLocation, {
        headers: {
          "Ocp-Apim-Subscription-Key": apiKey,
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Response JSON:", result);

        if (result.status === "succeeded") {
          // Extract the data you want to save
          const dataToSave = {
            image_name: imageFile.name, // Extract image name
            json_data: JSON.stringify(result), // Store the entire JSON
          };

          console.log("Data to save:", dataToSave); // Log the data

          // Send the data to your Django backend for saving
          await saveAnalysisResultToDjango(dataToSave);

          // Render the analysis results as before
        //   renderAnalysisResults(result);
        //   console.log(result);

          // Extract fields and values using object iteration
          extractFieldsAndValues(result);
          break;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  } catch (error) {
    document.getElementById(
      "analysis-result"
    ).innerHTML = `An error occurred while retrieving analysis result: ${error.message}`;
  }
}

async function saveAnalysisResultToDjango(dataToSave) {
  try {
    const response = await fetch("/save-analysis-result/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSave),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(result.message); // Success message from Django
    } else {
      const errorText = await response.text();
      console.error("Error saving analysis result:", errorText);
    }
  } catch (error) {
    console.error("Error saving analysis result:", error);
  }
}


