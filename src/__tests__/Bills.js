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

// Je creer ma constante onNavigate pour gerer les routes
const onNavigate = (pathname) => {
	document.body.innerHTML = ROUTES({ pathname, data: bills })
}


describe("Given I am connected as an employee", () => {
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
    
    test('Ensuite, le newBill btn devrait être présent',  async () => {
			document.body.innerHTML = BillsUI({ data: bills })
			let btnNewBill = getByTestId(document.body, 'btn-new-bill')
			await waitFor(() => btnNewBill)
			expect(btnNewBill).toBeInTheDocument()
		})
    test('Ensuite, la page de chargement doit être rendue', () => {
			document.body.innerHTML = BillsUI({ loading: true })
			expect(screen.getAllByText('Loading...')).toBeTruthy()
		})
    test('la page error doir être rendu', () => {
			document.body.innerHTML = BillsUI({ error: 'oops an error' })
			expect(screen.getAllByText('Erreur')).toBeTruthy()
		})
    describe("quand on clique sur le boutton New Bill", () => {
      test("La page New bill doit apparaître", () => {
        document.body.innerHTML = BillsUI({ data: bills })
          let newBills = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage })
          newBills.handleClickNewBill = jest.fn()
          screen.getByTestId('btn-new-bill').addEventListener('click', newBills.handleClickNewBill)
          screen.getByTestId('btn-new-bill').click()
          expect(newBills.handleClickNewBill).toBeCalled()
      })
    })
    describe("quand on clique sur le boutton eye icon", () => {
      test("La modal dit apparaître", () => {
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
    describe('test d\'intégration GET', () => {
      
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


