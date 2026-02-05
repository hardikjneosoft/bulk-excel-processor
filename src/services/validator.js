

export function validateRow(row) {
  const errors = [];
  console.log
  if (!row.name || row.name.trim() === "") {
    errors.push("Name is required");
  }

  if (!row.email || !isValidEmail(row.email)) {
    errors.push("Valid email is required");
  }

  const age = parseInt(row.age);
  if (isNaN(age) || age < 1 || age > 150) {
    errors.push("Age must be between 1 and 150");
  } else {
    row.age = age;
  }
  return {
    valid: errors.length === 0,
    errors,
    data: row,
  };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
