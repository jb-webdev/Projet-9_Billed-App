/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("la page newBill devrait être rendue", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      //to-do write assertion
      expect(
				screen.getAllByText('Envoyer une note de frais')
			).toBeTruthy()
    })
    test('un formulaire avec neuf champs doit être rendu', () => {
			document.body.innerHTML = NewBillUI()
			const form = document.querySelector('form')
			expect(form.length).toEqual(9)
		})
  })
})
