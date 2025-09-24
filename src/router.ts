import { Router } from "express"
import { createProduct, deleteProduct, getProductById, getProducts, updateAvailability, updateProduct } from "./handlers/poduct"
import { body, param } from 'express-validator'
import { handleInputErrors } from "./middleware"

const router = Router()

router.get('/', getProducts)

router.get('/:id', 
    param('id').isInt(),
    handleInputErrors,
    getProductById
)

router.post('/',
    
    body('name').notEmpty().withMessage("Nombre del producto no puede ir vacio"),
    body('price')
        .isNumeric().withMessage("Valor no valido")
        .notEmpty().withMessage("El Precio del producto no puede ir vacio")
        .custom(value => value > 0).withMessage("Precio tiene que ser mayor que 0"),
    handleInputErrors,
    createProduct
)

router.put('/:id', 
    param('id').isInt().withMessage("ID invalido"),
    body('name').notEmpty().withMessage("Nombre del producto no puede ir vacio"),
    body('price')
        .isNumeric().withMessage("Valor no valido")
        .notEmpty().withMessage("El Precio del producto no puede ir vacio")
        .custom(value => value > 0).withMessage("Precio tiene que ser mayor que 0"),
    body('availability').isBoolean().withMessage("Tiene que ser boolean"),
    handleInputErrors,
    updateProduct
)

router.patch('/:id', 
    param('id').isInt(),
    handleInputErrors,
    updateAvailability
)

router.delete('/:id', 
    param('id').isInt().withMessage("ID invalido"),
    handleInputErrors,
    deleteProduct
)

export default router