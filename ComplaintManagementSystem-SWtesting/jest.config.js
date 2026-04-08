module.exports = {
    reporters: [
      "default",
      ["jest-html-reporter", {
        "pageTitle": "Test Report",
        "outputPath": "./jest-report.html",
        "includeFailureMsg": true,
        "includeConsoleLog": true
      }]
    ]
  };
  