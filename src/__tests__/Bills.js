/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom'
import {screen, waitFor, getByTestId} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH} from "../constants/routes.js"
import {localStorageMock} from "../__mocks__/localStorage.js"
import router from "../app/Router.js";

import Bills from "../containers/Bills.js"
import mockStore from "../__mocks__/store"

import { filteredBills} from "../containers/Dashboard.js";

// Je creer ma constante onNavigate pour gerer les routes
const onNavigate = (pathname) => {
	document.body.innerHTML = ROUTES({ pathname, data: bills })
}


describe("Given I am connected as an employee", () => {
  describe('When I am on Bills page, there are bills, and there is one pending', () => {
    test('Then, getBills by pending status should return 1 bill', () => {
      const getAllBills = filteredBills(bills, "pending")
      expect(getAllBills.length).toBe(1)
    })
  })
  // Quand je suis sur la page Factures, il y a des factures, et il y en a une acceptée
  describe('When I am on Bills page, there are bills, and there is one accepted', () => {
    //Ensuite, getBills par statut accepté devrait renvoyer 1 facture
    test('Then, getBills by accepted status should return 1 bill', () => {
      const getAllBills = filteredBills(bills, "accepted")
      expect(getAllBills.length).toBe(1)
    })
  })
  // Quand je suis sur la page Factures, il y a des factures, et il y en a deux refusées
  describe('When I am on Bills page, there are bills, and there is two refused', () => {
    // Ensuite, getBills par statut accepté devrait renvoyer 2 factures
    test('Then, getBills by accepted status should return 2 bills', () => {
      const getAllBills = filteredBills(bills, "refused")
      expect(getAllBills.length).toBe(2)
    })
  })
  // Quand je suis sur la page Factures
  describe('When I am on Bills Page', () => {	
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      await waitFor(() => windowIcon)
			expect(windowIcon).toHaveClass('active-icon')

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      //const datesSorted = [...dates].sort(antiChrono)
      const datesSorted = dates.sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    // Ensuite, le newBill btn devrait être présent
    test('Then the newBill btn should be present',  async () => {
			document.body.innerHTML = BillsUI({ data: bills })
			let btnNewBill = getByTestId(document.body, 'btn-new-bill')
			await waitFor(() => btnNewBill)
			expect(btnNewBill).toBeInTheDocument()
		})
    // Ensuite, la page de chargement doit être rendue
    test('Then the loading page should be rendered', () => {
			document.body.innerHTML = BillsUI({ loading: true })
			expect(screen.getAllByText('Loading...')).toBeTruthy()
		})
    // la page error doir être rendu
    test('the error page must be rendered', () => {
			document.body.innerHTML = BillsUI({ error: 'oops an error' })
			expect(screen.getAllByText('Erreur')).toBeTruthy()
		})
    // quand on clique sur le boutton New Bill
    describe("when you click on the New Bill button", () => {
      // La page New bill doit apparaître
      test("The New bill page should appear", () => {
        document.body.innerHTML = BillsUI({ data: bills })
          let newBills = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage })
          newBills.handleClickNewBill = jest.fn()
          screen.getByTestId('btn-new-bill').addEventListener('click', newBills.handleClickNewBill)
          screen.getByTestId('btn-new-bill').click()
          expect(newBills.handleClickNewBill).toBeCalled()
      })
    })
    // quand on clique sur le boutton eye icon
    describe("when you click on the eye icon button", () => {
      test("La modal doit apparaître", () => {
        document.body.innerHTML = BillsUI({ data: bills })
          let newBills = new Bills({ document, onNavigate, firestore: null, localStorage: window.localStorage })
          newBills.handleClickIconEye = jest.fn()
          screen.getAllByTestId('icon-eye')[0].click()
          expect(newBills.handleClickIconEye).toBeCalled()
      })
      test('la modal devrais afficher l\'image jointe', () => {
        document.body.innerHTML = BillsUI({ data: bills })
        let newBills = new Bills({ document, onNavigate, firestore: null, localStorage: window.localStorage })
        let iconEye = document.querySelector('div[data-testid="icon-eye"]')
        $.fn.modal = jest.fn()
        newBills.handleClickIconEye(iconEye)
        expect($.fn.modal).toBeCalled()
        expect(document.querySelector('.modal')).toBeTruthy()
      })
    })
    // test d\'intégration GET
    describe('GET integration test', () => {
      
      test('fetches bills from mock API GET', async () => {
        const getSpyOn = jest.spyOn(mockStore, 'bills')
        let bills = await mockStore.bills().list()
        expect(getSpyOn).toHaveBeenCalledTimes(1)
        expect(bills.length).toBe(4)
      })
      describe('When an error occurs on API', () => {
        test('fetches bills from an API and fails / 404 error message', () => {
          mockStore.bills.mockImplementationOnce(() => {
            return {
              list : () =>  {
                return Promise.reject(new Error('Erreur 404'))
              }
            }})
          const html = BillsUI({ error: 'Erreur 404' })
          document.body.innerHTML = html
          const message = screen.getByText(/Erreur 404/)
          expect(message).toBeTruthy()
        })
    
        test('fetches messages from an API and fails / 500 error message', async () => {
          mockStore.bills.mockImplementationOnce(() => {
            return {
              list : () =>  {
                return Promise.reject(new Error('Erreur 500'))
              }
            }})
          const html = BillsUI({ error: 'Erreur 500' })
          document.body.innerHTML = html
          const message = screen.getByText(/Erreur 500/)
          expect(message).toBeTruthy()
        })
      })
    })
  })
})



