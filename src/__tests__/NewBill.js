/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom'
import { fireEvent, screen, waitFor } from '@testing-library/dom'
import NewBillUI from '../views/NewBillUI.js'
import NewBill from '../containers/NewBill.js'

import BillsUI from '../views/BillsUI.js'
import { localStorageMock } from '../__mocks__/localStorage.js'
import { ROUTES, ROUTES_PATH } from '../constants/routes.js'
import mockStore from '../__mocks__/store'
import router from '../app/Router.js'

import store from '../__mocks__/store.js'
import userEvent from '@testing-library/user-event'


import { bills } from '../fixtures/bills.js'


jest.mock('../app/Store', () => mockStore)

const onNavigate = jest.fn((pathname) => {
	document.body.innerHTML = ROUTES({ pathname })
  })

describe('Given I am connected as an employee', () => {
	describe('When I am on NewBill Page', () => {
		// la page newBill devrait être rendue
		test('the newBill page should be rendered', () => {
			const html = NewBillUI()
			document.body.innerHTML = html
			//to-do write assertion
			expect(screen.getAllByText('Envoyer une note de frais')
			).toBeTruthy()
		})
		// un formulaire avec neuf champs doit être rendu
		test('a form with 9 fields must be rendered', () => {
			document.body.innerHTML = NewBillUI()
			const form = document.querySelector('form')
			expect(form.length).toEqual(9)
		})

		// Ensuite, l'icône de courrier en disposition verticale doit être mise en surbrillance
		test('Then the mail icon in vertical layout should be highlighted', async () => {
			Object.defineProperty(window, 'localStorage', { value: localStorageMock })
			window.localStorage.setItem('user', JSON.stringify({
				type: 'Employee'
			}))
			var root = document.createElement('div')
			root.setAttribute('id', 'root')
			document.body.append(root)
			router()
			window.onNavigate(ROUTES_PATH.NewBill)
			await waitFor(() => screen.getByTestId('icon-mail'))
			const mailIcon = screen.getByTestId('icon-mail')
			expect(mailIcon.className).toBe('active-icon')
		})

	})
	describe('When I select a file', () => {
	  test('it should check if function handleChangeFile have been called', () => {
	
		document.body.innerHTML = NewBillUI()
		const newBill = new NewBill({
		  document, 
		  onNavigate,
		  store: mockStore,
		  localStorage: window.localStorage
		})
		const handleChangeFile = jest.fn(newBill.handleChangeFile)
		const inputBtn = screen.getByTestId('file')
		inputBtn.addEventListener('change', handleChangeFile)
		fireEvent.change(inputBtn, {
		  target: {
			files: [new File(['test.jpg'], 'test.jpg', {type: 'image/jpg'})]
		  }
		})
		expect(handleChangeFile).toHaveBeenCalled()
		expect(inputBtn.files[0].name).toBe('test.jpg')
	  })
	})
  })
  
  // test d'intégration  de type POST
  // Etant donné que je suis un utilisateur connecté en tant que Salarié
describe('Since I am a user logged in as an Employee', () => {
	describe('When I fill in the required fields in the correct format and click the submit button', () => {
		// ensuite on simule une nouvelle facture vers API POST
		test('then we simulate a new invoice to API POST', async () => {
			const html = NewBillUI()
			document.body.innerHTML = html

			const createdBill = new NewBill({
				document,
				onNavigate,
				store: mockStore,
				localStorage: window.localStorage,
			})
			expect(createdBill).toBeDefined()
			expect(screen.getByText('Envoyer une note de frais')).toBeTruthy()
			let testBill = {
				id: 'BeKy598729423xZ',
				vat: '10',
				amount: 50,
				name: 'test de la méthode post',
				fileName: 'jyhad.jpeg',
				commentary: 'test post newbill',
				pct: 20,
				type: 'Transports',
				email: 'a@a',
				fileUrl:
					'https://jyhad.jpg',
				date: '2022-08-05',
				status: 'pending',
				commentAdmin: 'euh',
			}
			const handleSubmit = jest.spyOn(createdBill, 'handleSubmit')
			const form = screen.getByTestId('form-new-bill')
			form.addEventListener('submit', handleSubmit)
			fireEvent.submit(form)
			expect(handleSubmit).toHaveBeenCalled()

			const getSpyOn = jest.spyOn(mockStore, 'bills')

			const billTested = await mockStore.bills().update(testBill)

			expect(getSpyOn).toHaveBeenCalledTimes(1)
			expect(billTested.id).toBe('47qAXb6fIm2zOKkLzMro')
		})
	})
	
	describe('When an error occurs on API', () => {
		beforeEach(() => {
			jest.spyOn(mockStore, 'bills')
			window.localStorage.setItem('user', JSON.stringify({
				type: 'Employee',
				email: 'a@a'
			}))
			var root = document.createElement('div')
			root.setAttribute('id', 'root')
			document.body.appendChild(root)
			router()
		})
		// erreur 404 retour API
		test('404 error when retrieving invoices from the API', async () => {
			mockStore.bills.mockImplementationOnce(() => {
				return {list: () => {return Promise.reject(new Error('Erreur 404'))}}
			})
			window.onNavigate(ROUTES_PATH.Bills)
			document.body.innerHTML = BillsUI({ error: 'Erreur 404' })
			await new Promise(process.nextTick)
			const messageRetour = screen.getByText(/Erreur 404/)
			expect(messageRetour).toBeTruthy()
		})
		// erreur 500 retour API
		test('error 500 when retrieving invoices from the API', async () => {
			mockStore.bills.mockImplementationOnce(() => {
				return {list: () => {return Promise.reject(new Error('Erreur 500'))}}
			})
			window.onNavigate(ROUTES_PATH.Bills)
			document.body.innerHTML = BillsUI({ error: 'Erreur 500' })
			await new Promise(process.nextTick)
			const messageRetour = screen.getByText(/Erreur 500/)
			expect(messageRetour).toBeTruthy()
		})
	})
	
})
