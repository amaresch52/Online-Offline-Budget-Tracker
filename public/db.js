let db;
let budgetControl;

const request = window.indexedDB.open("BudgetDB", budgetControl || 21);

request.onupgradeneeded = (event) => {
  db = event.target.result;
  const budgetPending = db.createObjectStore("BudgetDB", {
    autoIncrement: true,
  });
  budgetPending.createIndex("pendingStatus", "pending");
};

request.onsuccess = (event) => {
  db = event.target.result;
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = (error) => {
  console.log("ERROR:", error);
};

function saveRecord(record) {
  const transaction = db.transaction(["BudgetDB"], "readwrite");
  const budgetPending = transaction.objectStore("BudgetDB");

  budgetPending.add(record);
}

checkDatabase = () => {
  const transaction = db.transaction(["BudgetDB"], "readwrite");
  const budgetPending = transaction.objectStore("BudgetDB");
  const getRequest = budgetPending.getAll();

  getRequest.onsuccess = () => {
    if (getRequest.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getRequest.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then(() => {
          const transaction = db.transaction(["BudgetDB"], "readwrite");
          const budgetPending = transaction.objectStore("BudgetDB");

          budgetPending.clear();
        });
    }
  };
};

window.addEventListener("online", checkDatabase);
