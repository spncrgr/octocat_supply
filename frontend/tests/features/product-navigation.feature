Feature: Product catalog discovery
  As a supply chain planner
  I want to access the product catalog from the home page and search for products
  So that I can quickly evaluate items to fulfill upcoming orders

  Scenario: Navigate from the home page to the product catalog
    Given I am on the home page
    When I select the Products navigation link
    Then I land on the product catalog page
    And I see the catalog header "Products"

  Scenario: Search for a product by name
    Given I am viewing the product catalog
    And the catalog includes "SmartFeeder One"
    When I search for "SmartFeeder"
    Then the results list shows "SmartFeeder One"
    And the product description is visible in the results

  Scenario: Search for a product with no matches
    Given I am viewing the product catalog
    When I search for "Space Tuna"
    Then I see the empty state message "No products found"
    And I am prompted to adjust the search filters

  Scenario: Add and remove products in the cart
    Given I am viewing the product catalog
    When I increase the quantity of a product and add it to the cart
    Then the cart badge updates with the selected quantity
    When I open the cart page
    And shipping follows the free-over-$100 rule
    And I remove the item from the cart
    Then I see the empty cart state