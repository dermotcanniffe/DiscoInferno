Feature: Getting the Server Up and running

Scenario: Start the server
  Given the server is not running
  When I start the server
  Then the server should be running
