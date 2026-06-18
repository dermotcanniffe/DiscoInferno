Feature: User authentication

  As a user of DiscoInferno,
  I want to register and log in to the application,
  so that my Example Maps are private and associated with my account.

  # --- Registration ---

  Scenario: Registering a new account
    Given I am on the registration page
    When I enter a valid email and password
    And I submit the registration form
    Then I should see a success message
    And I should be redirected to the login page

  Scenario: Registering with an email already in use
    Given I am on the registration page
    And a user with email "existing@example.com" already exists
    When I enter "existing@example.com" and a password
    And I submit the registration form
    Then I should see an error message about the email being in use

  Scenario: Registering without required fields
    Given I am on the registration page
    When I submit the registration form without an email
    Then the form should not be submitted

  # --- Login ---

  Scenario: Logging in with valid credentials
    Given I am on the login page
    And I have a registered account
    When I enter my email and password
    And I submit the login form
    Then I should be redirected to the dashboard
    And I should see my name or email in the navigation bar

  Scenario: Logging in with incorrect password
    Given I am on the login page
    And I have a registered account
    When I enter my email and a wrong password
    And I submit the login form
    Then I should see an error message about incorrect credentials

  Scenario: Logging in with a non-existent email
    Given I am on the login page
    When I enter an unregistered email and any password
    And I submit the login form
    Then I should see an error message about incorrect credentials

  # --- Logout ---

  Scenario: Logging out
    Given I am logged in
    When I click the logout button
    Then I should be redirected to the login page
    And I should no longer see the navigation links for authenticated users

  # --- Route Protection ---

  Scenario: Accessing the dashboard without being logged in
    Given I am not logged in
    When I try to visit the dashboard
    Then I should be redirected to the login page

  Scenario: Accessing the map editor without being logged in
    Given I am not logged in
    When I try to visit a map editor URL
    Then I should be redirected to the login page

  Scenario: Accessing the settings page without being logged in
    Given I am not logged in
    When I try to visit the settings page
    Then I should be redirected to the login page
