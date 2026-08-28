Feature: Cart page management
  As a supply chain planner
  I want to manage items in my cart
  So that I can review and adjust my selections before checkout

  Scenario: View the empty cart state
    Given I am on the cart page with no items
    Then I see the heading "Your Cart"
    And I see the message "Your cart is currently empty."
    And I can browse products from the empty cart state

  Scenario: Add a product and review the order summary
    Given I am viewing the product catalog
    When I add "SmartFeeder One" to the cart with a quantity of 2
    Then the cart badge shows "Open cart with 2 items"
    And I land on the cart page
    And I see the product in the cart table
    And I see the order summary panel

  Scenario: Update product quantity inside the cart
    Given I have "SmartFeeder One" in my cart
    When I change the quantity to 3
    Then the quantity input shows 3
    And the cart badge shows "Open cart with 3 items"

  Scenario: Remove a product and return to the empty cart state
    Given I have a product in my cart
    When I remove the product from the cart
    Then the product is no longer listed
    And I see the message "Your cart is currently empty."
