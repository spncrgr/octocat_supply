Feature: Purchase order management
  As a buyer
  I want to create, submit, approve, and fulfill purchase orders
  So that I can manage high-value supplier orders reliably

  Scenario: Create a draft purchase order with line items
    Given I am on the purchase orders page
    When I enter branch 1, supplier 1, and buyer "buyer-demo"
    And I add a line item with product 1, quantity 2, and expected unit price 500
    And I create the draft
    Then the new purchase order is visible in the list
    And the order status is "Draft"

  Scenario: Submit a draft to notify the supplier
    Given I have a draft purchase order
    When I submit the purchase order
    Then the order status becomes "Submitted"
    And the latest notification is shown

  Scenario: Approve a high-value purchase order before fulfillment
    Given I have a submitted purchase order above the approval threshold
    When I enter approver "manager-1"
    And I approve the order
    Then the order status becomes "Approved"
    And the approval panel shows that approval is complete

  Scenario: Fulfill an approved order
    Given I have an approved purchase order
    When I click "Mark Fulfilled"
    Then the order status becomes "Fulfilled"
