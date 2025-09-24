import request from 'supertest'
import server from '../../server'

describe("POST /api/products", () => {
    it('should display validation errors', async () => {
        const response = await request(server).post('/api/products').send({})
        expect(response.status).toEqual(400)
        expect(response.body).toHaveProperty('errors')
        expect(response.body.errors).toHaveLength(4)

        expect(response.status).not.toEqual(404)
        expect(response.body.errors).not.toHaveLength(2)
    })

    it('should validate that the price is greater than 0', async () => {
        const response = await request(server).post('/api/products').send({
            name: "Teclado testing",
            price: 0
        })
        expect(response.status).toEqual(400)
        expect(response.body).toHaveProperty('errors')
        expect(response.body.errors).toHaveLength(1)

        expect(response.status).not.toEqual(404)
        expect(response.body.errors).not.toHaveLength(2)
    })

    it('should validate that the price is a number and greater than 0', async () => {
        const response = await request(server).post('/api/products').send({
            name: "Teclado testing",
            price: "Test"
        })
        expect(response.status).toEqual(400)
        expect(response.body).toHaveProperty('errors')
        expect(response.body.errors).toHaveLength(2)

        expect(response.status).not.toEqual(404)
        expect(response.body.errors).not.toHaveLength(4)
    })

    it('should create a new product', async () => {
        const response = await request(server).post('/api/products').send({
            name: "Teclado testing",
            price: 80
        })
        expect(response.status).toEqual(201)
        expect(response.body).toHaveProperty('data')

        expect(response.status).not.toEqual(200)
        expect(response.status).not.toEqual(404)
        expect(response.body).not.toHaveProperty('errors')
    })
})

describe("GET /api/products", () => {
    it("GET a JSON response a with products", async () => {
        const response = await request(server).get('/api/products')
        expect(response.status).toEqual(200)
        expect(response.headers['content-type']).toMatch(/json/)
        expect(response.body).toHaveProperty('data')
        expect(response.body.data).toHaveLength(1)
        expect(response.status).not.toEqual(404)
        expect(response.body).not.toHaveProperty('errors')
    })
})

describe("GET /api/products/:id", () => {
    it("Should return a 404 response for a non-existen product", async () => {
        const productId = 2000
        const response = await request(server).get(`/api/products/${productId}`)
        expect(response.status).toEqual(404)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toBe('Product not found')
    })

    it("Should check a valid ID in the URL", async () => {
        const productId = "not-valid-url"
        const response = await request(server).get(`/api/products/${productId}`)
        expect(response.status).toEqual(400)
        expect(response.body).toHaveProperty('errors')
        expect(response.body.errors).toHaveLength(1)
        expect(response.body.errors[0].msg).toBe("Invalid value")
    })

    it("GET a JSON response for a single product", async () => {
        const productId = 1
        const response = await request(server).get(`/api/products/${productId}`)
        expect(response.status).toEqual(200)
        expect(response.body).toHaveProperty('data')
    })
})

describe("PUT /api/products/:id", () => {
    it("Should check a valid ID in the URL", async () => {
        const response = await request(server).put('/api/products/not-valid-url').send({
            name: 'Teclado membrana test',
            price: 60,
            availability: true
        })
        expect(response.status).toEqual(400)
        expect(response.body).toHaveProperty('errors')
        expect(response.body.errors).toHaveLength(1)
        expect(response.body.errors[0].msg).toBe("ID invalido")
    })

    it("should display validation error messages when updating a product", async() => {
        const response = await request(server).put('/api/products/1').send({})
        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('errors')
        expect(response.body.errors).toBeTruthy()
        expect(response.body.errors).toHaveLength(5)

        expect(response.status).not.toBe(200)
        expect(response.body).not.toHaveProperty('data')
    })

    it("should validate that the price is greater than 0", async() => {
        const response = await request(server).put('/api/products/1').send({
            name: 'Teclado membrana',
            price: -60,
            availability: true
        })
        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('errors')
        expect(response.body.errors).toBeTruthy()
        expect(response.body.errors).toHaveLength(1)
        expect(response.body.errors[0].msg).toBe("Precio tiene que ser mayor que 0")
        
        expect(response.status).not.toBe(200)
        expect(response.body).not.toHaveProperty('data')
    })

    it("should return a 404 response for a non-existent product", async() => {
        const productId = 2000
        const response = await request(server).put(`/api/products/${productId}`).send({
            name: 'Teclado membrana',
            price: 60,
            availability: true
        })
        expect(response.status).toBe(404)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toBe("Product not found")
        
        expect(response.status).not.toBe(200)
        expect(response.body).not.toHaveProperty('data')
    })

    it("should update an existing product with valid data", async() => {
        const productId = 1
        const response = await request(server).put(`/api/products/${productId}`).send({
            name: 'Teclado membrana',
            price: 60,
            availability: true
        })
        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('data')
        
        expect(response.status).not.toBe(400)
        expect(response.status).not.toBe(404)
        expect(response.body).not.toHaveProperty('errors')
    })
})

describe("PATCH /api/products/:id", () => {
    // it("should check a valid ID", async () => {
    //     const response = await request(server).delete('/api/products/not-valid')
    //     expect(response.status).toBe(400)
    //     expect(response.body.errors).toBeTruthy()
    //     expect(response.body.errors).toHaveLength(1)
    //     expect(response.body.errors[0].msg).toBe("ID invalido")
    // })

    it("should return a 404 response for a non-existent product", async () => {
        const productId = 2000
        const response = await request(server).patch(`/api/products/${productId}`)
        expect(response.status).toBe(404)
        expect(response.body.error).toBe("Product not found")

        expect(response.status).not.toBe(400)
        expect(response.status).not.toBe(200)
    })

    it("should update availability product", async () => {
        const productId = 1
        const response = await request(server).patch(`/api/products/${productId}`)
        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('data')
        expect(response.body.data.availability).toBe(false)

        expect(response.status).not.toBe(400)
        expect(response.status).not.toBe(404)
        expect(response.body).not.toHaveProperty('errors')
    })
})

describe("DELETE /api/products/:id", () => {
    it("should check a valid ID", async () => {
        const response = await request(server).delete('/api/products/not-valid')
        expect(response.status).toBe(400)
        expect(response.body.errors).toBeTruthy()
        expect(response.body.errors).toHaveLength(1)
        expect(response.body.errors[0].msg).toBe("ID invalido")
    })

    it("should return a 404 response for a non-existent product", async () => {
        const productId = 2000
        const response = await request(server).delete(`/api/products/${productId}`)
        expect(response.status).toBe(404)
        expect(response.body.error).toBe("Product not found")

        expect(response.status).not.toBe(400)
        expect(response.status).not.toBe(200)
    })

    it("should delete a product", async () => {
        const productId = 1
        const response = await request(server).delete(`/api/products/${productId}`)
        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('data')
        expect(response.body.data).toBe('Se elimino correctamente')

        expect(response.status).not.toBe(400)
        expect(response.status).not.toBe(404)
    })
})