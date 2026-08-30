Feature: Cart badge and subtotal flow
  As a shopper
  I want to add products to the cart and confirm the cart updates correctly
  So that I can review my order before checkout

  Scenario: Add two products, confirm subtotal, and remove one item
    Given I am on the product catalog
    When I add SmartFeeder One to the cart
    And I add Smart Fountain Flow+ to the cart
    Then the cart badge shows "2"
    When I open the cart page
    Then the subtotal is "$149.99"
    When I remove one item from the cart
    Then the cart badge updates to "1"
