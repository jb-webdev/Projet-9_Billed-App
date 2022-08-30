import { ROUTES_PATH } from '../constants/routes.js'
import Logout from "./Logout.js"

/** on gere l'état de la validité du fomrulaire avant envoie  */
let stateIsTrue = true

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
    formNewBill.addEventListener("submit", this.handleSubmit)
    const file = this.document.querySelector(`input[data-testid="file"]`)
    file.addEventListener("change", this.handleChangeFile)
    this.fileUrl = null
    this.fileName = null
    this.billId = null
    new Logout({ document, localStorage, onNavigate })
  }
  /**
   * dans handleChangeFile()
   * empêcher la saisie d'un document qui a une extension différente de 
   * jpg, jpeg ou png au niveau du formulaire du fichier NewBill.js. 
   * */
  handleChangeFile = e => {
    e.preventDefault()
    /** on stock nos extension valide */
    const extensionImageAttendue = ["jpg", "jpeg", "png", "JPG", "JPEG", "PNG"]
    /** Je recupere dans le DOM la balise "p" message error creer dans le fichier views/NewBillUI.js - Ligne 59 */
    const errorMessage = this.document.getElementById("error-message");
    const file = this.document.querySelector(`input[data-testid="file"]`).files[0]
    /** on recupere l'extension de l'element */
    const extensionFichier = file.name.split(".").pop();
    //console.log(extensionFichier)

    if (extensionImageAttendue.includes(extensionFichier)){

      const filePath = e.target.value.split(/\\/g)
      const fileName = filePath[filePath.length-1]
      const email = JSON.parse(localStorage.getItem("user")).email
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('email', email)
      /** Je verifie que rien n'est afficher dans la balise si le format de l'extension est conforme */
      errorMessage.textContent = "";
      this.store
        .bills()
        .create({
          data: formData,
          headers: {
            noContentType: true
          }
        })
        .then(({fileUrl, key}) => {
          console.log(fileUrl)
          this.billId = key
          this.fileUrl = fileUrl
          this.fileName = fileName
        }).catch(error => console.error(error))
    } else {
      errorMessage.textContent = "veuillez joindre un fichier valide de type jpg, jpeg, png !";
      //alert("veuillez joindre un fichier valide de type (jpg, jpeg, png !")
      stateIsTrue = false
    }

  }
  handleSubmit = e => {
    /** Avant l'envoie on verifie si stateIsTrue === true si il est a false on bloc l'envoie du fomulaire. */
    if (stateIsTrue === true) {
      e.preventDefault()
      console.log('e.target.querySelector(`input[data-testid="datepicker"]`).value', e.target.querySelector(`input[data-testid="datepicker"]`).value)
      const email = JSON.parse(localStorage.getItem("user")).email
      const bill = {
        email,
        type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
        name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
        amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
        date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
        vat: e.target.querySelector(`input[data-testid="vat"]`).value,
        pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
        commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
        fileUrl: this.fileUrl,
        fileName: this.fileName,
        status: 'pending'
      }
      this.updateBill(bill)
      this.onNavigate(ROUTES_PATH['Bills'])
    } else {
      e.preventDefault();
      alert ("veuillez joindre un fichier valide de type (jpg, jpeg, png !")
    }

  }

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH['Bills'])
        })
        .catch(error => console.error(error))
    }
  }
}