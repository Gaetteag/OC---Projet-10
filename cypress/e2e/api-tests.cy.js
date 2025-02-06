import { userData } from '../support/config';

describe("API Tests", () => {
    let authToken = '';

    before(() => {
        cy.request({
            method: 'POST', 
            url: `${Cypress.config('apiUrl')}/login`,
            body: {
                username: userData.userEmail,
                password: userData.userPassword
            }
        }).then((response) => {
            expect(response.status).to.eq(200);
            authToken = response.body.token;
        });
    });

    ///////////////////////////// Données confidentielles //////////////////////////////
    describe("Données confidentielles avant connexion", () => {
            it('Requête sur les données confidentielles avant connexion', () => {
            cy.request({
                method: 'GET',
                url: `${Cypress.config('apiUrl')}/orders`,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(403);
            });
        });
    });

    ////////////////////////////// Panier //////////////////////////////
    describe("Panier", () => {
        beforeEach(() => {
            cy.request({
                method: 'GET',
                url: `${Cypress.config('apiUrl')}/orders`,
                headers: { Authorization: `Bearer ${authToken}` }
            }).then((response) => {
                expect(response.status).to.eq(200);
                const productsInCart = response.body.orderLines;
                if (productsInCart.length > 0) {
                    productsInCart.forEach((product) => {
                        cy.request({
                            method: 'DELETE',
                            url: `${Cypress.config('apiUrl')}/orders/${product.id}/delete`,
                            headers: { Authorization: `Bearer ${authToken}` }
                        }).then((deleteResponse) => {
                            expect(deleteResponse.status).to.eq(200);
                        });
                    });
                }
            });
        });

        it("Ajoute un produit disponible au panier", () => {
            cy.request({
              method: 'POST',
              url: `${Cypress.config('apiUrl')}/orders/add`,
              headers: { Authorization: `Bearer ${authToken}` },
              body: {
                product: 5,
                quantity: 1
              },
              failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body).to.have.property('orderLines').that.is.an("array"); 
                const orderLine = response.body.orderLines[0];
                const product = orderLine.product;
                const quantity = orderLine.quantity;
                expect(product).to.have.property('name');
                expect(orderLine).to.have.property('quantity');
                cy.log(`Produit : ${product.name} (Quantité: ${quantity})`);
            });
        });

        it("Ajoute un produit en rupture de stock au panier", () => {
            cy.request({
              method: 'POST',
              url: `${Cypress.config('apiUrl')}/orders/add`,
              headers: { Authorization: `Bearer ${authToken}` },
              body: {
                product: 3,
                quantity: 1
              },
              failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body).to.have.property('orderLines'); 
                const orderLine = response.body.orderLines[0];
                const product = orderLine.product;
                const quantity = orderLine.quantity;
                expect(product).to.have.property('name');
                expect(orderLine).to.have.property('quantity');
                cy.log(`Produit : ${product.name} (Quantité: ${quantity})`);
            });
        });
    });
});