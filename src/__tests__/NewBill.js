/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { fireEvent, screen } from '@testing-library/dom'
import NewBillUI from '../views/NewBillUI.js'
import NewBill from '../containers/NewBill.js'
import store from '../__mocks__/store.js'
import userEvent from '@testing-library/user-event'
import mockStore from '../__mocks__/store'
import BillsUI from '../views/BillsUI.js'
import { ROUTES} from '../constants/routes.js'
import router from '../app/Router.js'
import { bills } from '../fixtures/bills.js'
import {localStorageMock} from '../__mocks__/localStorage.js'

// je créer une methode localstorage pour recuperer mes donnée
const setLocalStorage = (user) =>  {
	Object.defineProperty(window, 'localStorage', { value: localStorageMock })
	window.localStorage.setItem('user', JSON.stringify({ type: user, email: 'test@email.com' }))
}
setLocalStorage('Employee')

// Je creer ma constante onNavigate pour gerer les routes
const onNavigate = (pathname) => {
	document.body.innerHTML = ROUTES({ pathname, data: bills })
}

Object.defineProperty(window, 'location', {
	value: { hash: '#employee/bill/new' },
})


describe("Given I am connected as an employee", () => {
	describe("When I am on NewBill Page", () => {
		// la page newBill devrait être rendue
		test("the newBill page should be rendered", () => {
			const html = NewBillUI()
			document.body.innerHTML = html
			//to-do write assertion
			expect(
				screen.getAllByText('Envoyer une note de frais')
			).toBeTruthy()
		})
		// un formulaire avec neuf champs doit être rendu
		test('a form with nine fields must be rendered', () => {
			document.body.innerHTML = NewBillUI()
			const form = document.querySelector('form')
			expect(form.length).toEqual(9)
		})
	})
	// Quand je suis sur la page NewBill
	describe('When I\'m on the NewBill page', () => {
		// et qu'ensuite je telecharge un fichier de type image
		describe('and then I download an image type file', () => {
			// Ensuite, le gestionnaire de fichiers devrait afficher un fichier
			test('Then the file handler should show a file', () => {
				document.body.innerHTML = NewBillUI()
				const newBill = new NewBill({
					document,
					onNavigate,
					store,
					localStorage: window.localStorage,
				})
				const handleChangeFile = jest.fn(
					() => newBill.handleChangeFile
				)
				const inputFile = screen.getByTestId('file')
				inputFile.addEventListener('change', handleChangeFile)

				fireEvent.change(inputFile, {
					target: {
						files: [
							new File(['sample.jpg'], 'sample.jpg', {
								type: 'image/jpg',
							})
						],
					},
				})
				const numberOfFile = screen.getByTestId('file').files.length
				expect(numberOfFile).toEqual(1)
				expect(handleChangeFile).toBeCalled()
				expect(inputFile.files[0].type).toBe('image/jpg')
				expect(document.getElementById('error-message').textContent).toBe('')
			})
		})
		// et qu'ensuite je telecharge un fichier qui n'est pas une image
		describe('and then I upload a file that is not an image', () => {
			// Ensuite, le message d'erreur devrait s'afficher
			test('Then the error message should be display', () => {
				document.body.innerHTML = NewBillUI()
				const newBill = new NewBill({
					document,
					onNavigate,
					store,
					localStorage: window.localStorage,
				})
				const handleChangeFile = jest.fn(
					() => newBill.handleChangeFile
				)
				const inputFile = screen.getByTestId('file')
				inputFile.addEventListener('change', handleChangeFile)
				fireEvent.change(inputFile, {
					target: {
						files: [
							new File(['sample.txt'], 'sample.txt', {
								type: 'text/txt',
							})
						],
					},
				})
				expect(handleChangeFile).toBeCalled()
				expect(inputFile.files[0].type).toBe('text/txt')
				expect(document.getElementById('error-message').textContent).toBe('veuillez joindre un fichier valide de type jpg, jpeg, png !')
			})
		})
		// Et que je soumets un formulaire de facture valide
		describe('And that I submit a valid invoice form', () => {
			// puis une facture est créée
			test('then an invoice is created', () => {
				document.body.innerHTML = NewBillUI()
				const newBill = new NewBill({
					document,
					onNavigate,
					store,
					localStorage: window.localStorage,
				})
				const submit = screen.getByTestId('form-new-bill')
				const validBill = {
					name: 'validBill',
					date: '2022-08-05',
					type: 'Restaurants et bars',
					amount: 10,
					pct: 10,
					vat: '40',
					fileName: 'test.jpg',
					fileUrl: 'https://jyjystudio.github.io/test.jpg',
				}
				const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
				document.querySelector('input[data-testid="datepicker"]').value = validBill.date
				document.querySelector('input[data-testid="expense-name"]').value = validBill.name
				document.querySelector('select[data-testid="expense-type"]').value = validBill.type
				document.querySelector('input[data-testid="amount"]').value = validBill.amount
				document.querySelector('input[data-testid="pct"]').value = validBill.pct
				document.querySelector('input[data-testid="vat"]').value = validBill.vat
				document.querySelector('textarea[data-testid="commentary"]').value = validBill.commentary
				newBill.fileUrl = validBill.fileUrl
				newBill.fileName = validBill.fileName
				submit.addEventListener('click', handleSubmit)
				userEvent.click(submit)
				expect(handleSubmit).toHaveBeenCalled()
			})
		})
	})

	// test d'intégration  de type POST
	// Etant donné que je suis un utilisateur connecté en tant que Salarié
	describe('Since I am a user logged in as an Employee', () => {
		// Lorsque je remplis les champs requis dans le bon format et que je clique sur le bouton Soumettre
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
		// Lorsqu'une erreur se produit sur API
		describe('When an error occurs on API', () => {
			beforeEach(() => {
				jest.spyOn(mockStore, 'bills')
				Object.defineProperty(
					window,
					'localStorage',
					{ value: localStorageMock }
				)
				window.localStorage.setItem('user', JSON.stringify({
					type: 'Employee',
					email: 'a@a'
				}))
				const root = document.createElement('div')
				root.setAttribute('id', 'root')
				document.body.appendChild(root)
				router()
			})
			// erreur 404 lors de la recuperation des factures de l\'API
			test('404 error when retrieving invoices from the API', () => {
				mockStore.bills.mockImplementationOnce(() =>
					Promise.reject(new Error('Erreur 404'))
				)
				const html = BillsUI({ error: 'Erreur 404' })
				document.body.innerHTML = html
				const message = screen.getByText(/Erreur 404/)
				expect(message).toBeTruthy()
			})

			// erreur 500 lors de la recuperation des factures de l'API
			test('error 500 when retrieving invoices from the API', () => {
				mockStore.bills.mockImplementationOnce(() =>
					Promise.reject(new Error('Erreur 500'))
				)
				const html = BillsUI({ error: 'Erreur 500' })
				document.body.innerHTML = html
				const message = screen.getByText(/Erreur 500/)
				expect(message).toBeTruthy()
			})
		})
	})
})
