Feature: Manage JSON configurations

Scenario: Export a configuration to a JSON file
  Given a valid configuration object
  When I export it to a JSON file
  Then the file should be saved to the filesystem

Scenario: Load a configuration from a GitHub repository
  Given a valid GitHub repository link
  When I load the configuration
  And I do something else
  Then the configuration should be available in the application
