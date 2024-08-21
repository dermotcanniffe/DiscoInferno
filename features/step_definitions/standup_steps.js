import { Given, When, Then } from '@cucumber/cucumber';
import { assert } from 'chai';

// Step definition file for server-related steps


Given('the server is not running', function () {

    // Add your code here to handle the step
    assert.isTrue(1 == 1);  
  });

Then('the server should be running', function () {

  // Add code to check if the server is running
  assert.isTrue(1 == 1);
});

// TODO: Add step definition for "When I start the server"

When('I start the server', function () {

    // Add code to start the server here
    assert.isTrue(1 == 1);  
});
  