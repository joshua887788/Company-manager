const inquirer = require('inquirer');
const db = require('./database');

function startApp() {
  inquirer
    .prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          'View all departments',
          'View all roles',
          'View all employees',
          'Add a department',
          'Add a role',
          'Add an employee',
          'Update an employee role',
          'Exit',
        ],
      },
    ])
    .then((answers) => {
      switch (answers.action) {
        case 'View all departments':
          viewAllDepartments();
          break;
        case 'View all roles':
          viewAllRoles();
          break;
        case 'View all employees':
          viewAllEmployees();
          break;
        case 'Add a department':
          addDepartment();
          break;
        case 'Add a role':
          addRole();
          break;
        case 'Add an employee':
          addEmployee();
          break;
        case 'Update an employee role':
          updateEmployeeRole();
          break;
        case 'Exit':
          db.close();
          console.log('Goodbye!');
          break;
        default:
          console.log('Invalid action.');
          break;
      }
    });
}

function viewAllDepartments() {
  db.all('SELECT * FROM departments', (err, rows) => {
    if (err) throw err;

    console.table(rows);
    startApp();
  });
}

function viewAllRoles() {
  db.all(
    'SELECT roles.id, roles.title, roles.salary, departments.name AS department FROM roles ' +
      'INNER JOIN departments ON roles.department_id = departments.id',
    (err, roles) => {
      if (err) throw err;

      console.table(roles);
      startApp();
    }
  );
}


function viewAllEmployees() {
  db.all(
    'SELECT employees.id, employees.first_name, employees.last_name, ' +
      'roles.title, departments.name AS department, roles.salary, ' +
      'IFNULL(managers.first_name || " " || managers.last_name, "N/A") AS manager ' +
      'FROM employees ' +
      'INNER JOIN roles ON employees.role_id = roles.id ' +
      'INNER JOIN departments ON roles.department_id = departments.id ' +
      'LEFT JOIN employees AS managers ON employees.manager_id = managers.id',
    (err, employees) => {
      if (err) throw err;

      console.table(employees);
      startApp();
    }
  );
}



function addDepartment() {
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Enter the department name:',
      },
    ])
    .then((answers) => {
      db.run('INSERT INTO departments (name) VALUES (?)', answers.name, (err) => {
        if (err) throw err;
        console.log(`Department "${answers.name}" added.`);
        startApp();
      });
    });
}

function addRole() {
  db.all('SELECT * FROM departments', (err, departments) => {
    if (err) throw err;

    const departmentChoices = departments.map((department) => ({
      name: department.name,
      value: department.id,
    }));

    inquirer
      .prompt([
        {
          type: 'input',
          name: 'title',
          message: 'Enter the role title:',
        },
        {
          type: 'input',
          name: 'salary',
          message: 'Enter the role salary:',
          validate: (value) => {
            const valid = !isNaN(parseFloat(value));
            return valid || 'Please enter a valid number for salary.';
          },
        },
        {
          type: 'list',
          name: 'departmentId',
          message: 'Select the department for the role:',
          choices: departmentChoices,
        },
      ])
      .then((answers) => {
        db.run(
          'INSERT INTO roles (title, salary, department_id) VALUES (?, ?, ?)',
          [answers.title, answers.salary, answers.departmentId],
          (err) => {
            if (err) throw err;
            console.log(`Role "${answers.title}" added.`);
            startApp();
          }
        );
      });
  });
}

function addEmployee() {
  db.all('SELECT * FROM roles', (err, roles) => {
    if (err) throw err;

    const roleChoices = roles.map((role) => ({
      name: role.title,
      value: role.id,
    }));

    inquirer
      .prompt([
        {
          type: 'input',
          name: 'firstName',
          message: 'Enter the employee\'s first name:',
        },
        {
          type: 'input',
          name: 'lastName',
          message: 'Enter the employee\'s last name:',
        },
        {
          type: 'list',
          name: 'roleId',
          message: 'Select the employee\'s role:',
          choices: roleChoices,
        },
        {
          type: 'input',
          name: 'managerId',
          message: 'Enter the employee\'s manager ID (if applicable):',
          validate: (value) => {
            if (!value) return true; // Allow empty manager ID
            const valid = !isNaN(parseInt(value));
            return valid || 'Please enter a valid number for manager ID.';
          },
        },
      ])
      .then((answers) => {
        db.run(
          'INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)',
          [answers.firstName, answers.lastName, answers.roleId, answers.managerId || null],
          (err) => {
            if (err) throw err;
            console.log(`Employee "${answers.firstName} ${answers.lastName}" added.`);
            startApp();
          }
        );
      });
  });
}


function updateEmployeeRole() {
  db.all('SELECT * FROM employees', (err, employees) => {
    if (err) throw err;

    const employeeChoices = employees.map((employee) => ({
      name: `${employee.first_name} ${employee.last_name}`,
      value: employee.id,
    }));

    db.all('SELECT * FROM roles', (err, roles) => {
      if (err) throw err;

      const roleChoices = roles.map((role) => ({
        name: role.title,
        value: role.id,
      }));

      inquirer
        .prompt([
          {
            type: 'list',
            name: 'employeeId',
            message: 'Select the employee you want to update:',
            choices: employeeChoices,
          },
          {
            type: 'list',
            name: 'roleId',
            message: 'Select the new role for the employee:',
            choices: roleChoices,
          },
        ])
        .then((answers) => {
          db.run(
            'UPDATE employees SET role_id = ? WHERE id = ?',
            [answers.roleId, answers.employeeId],
            (err) => {
              if (err) throw err;
              console.log('Employee role updated successfully.');
              startApp();
            }
          );
        });
    });
  });
}


// Start the application
startApp();
