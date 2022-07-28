context('Basic', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('basic nav', () => {
    cy.url()
      .should('eq', 'http://localhost:3333/')

    cy.contains('Cloud')
      .should('exist')

    cy.get('[alt="logo"]')
      .parent()
      .click()
      .url()
      .should('eq', 'http://localhost:3333/')
  })

  it('markdown', () => {
    cy.get('[title="Projects"]')
      .click()
      .url()
      .should('eq', 'http://localhost:3333/projects')
  })
})
