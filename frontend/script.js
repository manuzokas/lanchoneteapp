document.addEventListener("DOMContentLoaded", function() {
    const menu = document.getElementById("menu");
    const cartBtn = document.getElementById("cart-btn");
    const cartModal = document.getElementById("cart-modal");
    const cartItemsContainer = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");
    const checkoutBtn = document.getElementById("checkout-btn");
    const closeModalBtn = document.getElementById("close-modal-btn");
    const cartCounter = document.getElementById("cart-count");
    const addressInput = document.getElementById("adress");
    const addressWarn = document.getElementById("adress-warn");
    const addItemForm = document.getElementById("add-item-form");
    const spanItem = document.getElementById("date-span");

    let cart = [];

    // URL da API
    const API_URL = "http://localhost:5000/api/lanches";

    // Função para buscar e renderizar os lanches do back-end
    async function fetchLanches() {
        try {
            const response = await fetch(API_URL);
            const lanches = await response.json();
            lanches.forEach(lanche => renderLanche(lanche));
        } catch (error) {
            console.error("Erro ao buscar lanches:", error);
        }
    }

    // renderizando meu lanche no DOM
   function renderLanche(lanche) {

    const lancheDiv = document.createElement("div");
    lancheDiv.classList.add("flex", "gap-2");

    const imageUrl = lanche.imagem_url 
        ? `http://127.0.0.1:5000${lanche.imagem_url}` 
        : 'http://127.0.0.1:5000/uploads/default.png'; // utilizando a imagem padrao, caso não seja selecionada uma imagem

    lancheDiv.innerHTML = `
        <img src="${imageUrl}" alt="${lanche.nome}" class="w-28 h-28 rounded-md hover:scale-110 hover:-rotate-2 duration-300" />
        <div>
            <p class="font-bold">${lanche.nome}</p>
            <p class="text-sm">${lanche.descricao}</p>
            <div class="flex items-center gap-2 justify-between mt-3">
                <p class="font-bold text-lg">R$ ${parseFloat(lanche.preco).toFixed(2)}</p>
                <div class="flex items-center gap-2">
                    <button class="decrease-qty bg-gray-900 px-2 rounded text-white" data-name="${lanche.nome}" data-price="${lanche.preco}">-</button>
                    <span id="quantity-${lanche.nome}" class="quantity-value">0</span>
                    <button class="increase-qty bg-gray-900 px-2 rounded text-white" data-name="${lanche.nome}" data-price="${lanche.preco}">+</button>
                </div>
            </div>
        </div>
    `;
    menu.appendChild(lancheDiv);
}



menu.addEventListener("click", function(event) {
    let target = event.target;
    
    if (target.classList.contains("increase-qty")) {
        const name = target.getAttribute("data-name");
        const price = parseFloat(target.getAttribute("data-price"));
        const quantityElement = document.getElementById(`quantity-${name}`);
        let currentQuantity = parseInt(quantityElement.textContent);
        
        currentQuantity++;
        quantityElement.textContent = currentQuantity;

        addToCart(name, price, currentQuantity); // Atualiza o carrinho com a nova quantidade
    }

    if (target.classList.contains("decrease-qty")) {
        const name = target.getAttribute("data-name");
        const price = parseFloat(target.getAttribute("data-price"));
        const quantityElement = document.getElementById(`quantity-${name}`);
        let currentQuantity = parseInt(quantityElement.textContent);
        
        // Permite reduzir até 0
        if (currentQuantity > 0) {
            currentQuantity--;
            quantityElement.textContent = currentQuantity;

            addToCart(name, price, currentQuantity); // Atualiza o carrinho com a nova quantidade
        }
    }
});


    // Inicializar o menu
    fetchLanches();

    // Funções para abrir/fechar o modal do carrinho, adicionar/remover itens, validação e finalizar pedido

    cartBtn.addEventListener("click", function() {
        updateCartModal();
        cartModal.style.display = "flex";
    });

    cartModal.addEventListener("click", function(event) {
        if (event.target === cartModal) {
            cartModal.style.display = "none";
        }
    });

    closeModalBtn.addEventListener("click", function() {
        cartModal.style.display = "none";
    });

    menu.addEventListener("click", function(event) {
        let parentButton = event.target.closest(".add-to-cart-btn");

        if (parentButton) {
            const name = parentButton.getAttribute("data-name");
            const price = parseFloat(parentButton.getAttribute("data-price"));

            addToCart(name, price);
        }
    });

    // Função para adicionar ou atualizar itens no carrinho
    function addToCart(name, price, quantity = 0) {
        const existingItem = cart.find(item => item.name === name);

        if (quantity === 0) {
            // Se a quantidade for 0, remover o item do carrinho
            if (existingItem) {
                cart = cart.filter(item => item.name !== name); // Remove o item
            }
        } else {
            if (existingItem) {
                existingItem.quantity = quantity; // Atualiza a quantidade
            } else {
                cart.push({
                    name,
                    price,
                    quantity
                });
            }
        }

        updateCartModal(); // Atualiza o modal do carrinho
    }


    // Função para atualizar o modal do carrinho
    function updateCartModal() {
        cartItemsContainer.innerHTML = "";
        let total = 0;

        cart.forEach(item => {
            const cartItemElement = document.createElement("div");
            cartItemElement.classList.add("flex", "justify-between", "mb-4", "flex-col");

            cartItemElement.innerHTML = `
                <div class="flex items-center justify-between">
                    <div>
                        <p class="font-bold">${item.name}</p>
                        <p>Quantidade: ${item.quantity}</p>
                        <p class="font-medium mt-2">R$ ${item.price.toFixed(2)}</p>
                    </div>
                    <button class="remove-from-cart-btn" data-name="${item.name}">
                       Remover
                    </button>
                </div>
            `;

            total += item.price * item.quantity;

            cartItemsContainer.appendChild(cartItemElement);
        });

        cartTotal.textContent = total.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

        cartCounter.textContent = cart.length;
    }

    
    cartItemsContainer.addEventListener("click", function(event) {
        if (event.target.classList.contains("remove-from-cart-btn")) {
            const name = event.target.getAttribute("data-name");
            removeItemCart(name);
        }
    });

    // Função para remover itens do carrinho (atualizada)
    function removeItemCart(name) {
        cart = cart.filter(item => item.name !== name);
        updateCartModal();
    }

    addressInput.addEventListener("input", function(event) {
        let inputValue = event.target.value;

        if (inputValue !== "") {
            addressInput.classList.remove("border-red-500");
            addressWarn.classList.add("hidden");
        }
    });

    checkoutBtn.addEventListener("click", function() {
        const isOpen = checkRestauranteOpen();
        if (!isOpen) {
            showToast("Ops, o restaurante está fechado no momento.", "#ef4444");
            return;
        }

        if (cart.length === 0) return;

        if (addressInput.value === "") {
            addressWarn.classList.remove("hidden");
            addressInput.classList.add("border-red-500");
            return;
        }

        const cartItems = cart.map(item => 
            ` ${item.name} Quantidade: (${item.quantity}) Preço: R$${item.price} |`
        ).join("");

        const message = encodeURIComponent(cartItems);
        const phone = "67996123728";

        window.open(`https://wa.me/${phone}?text=${message} Endereço: ${addressInput.value}`, "_blank");

        cart = [];
        updateCartModal();
    });

    const closeModalIcon = document.getElementById("close-modal-icon");

    closeModalIcon.addEventListener("click", function() {
        cartModal.style.display = "none";
    });


    function checkRestauranteOpen() {
        const data = new Date();
        const hora = data.getHours();
        return hora >= 19 || hora < 6;
    }

    const isOpen = checkRestauranteOpen();
    if (isOpen) {
        spanItem.classList.remove("bg-red-500");
        spanItem.classList.add("bg-green-600");
    } else {
        spanItem.classList.remove("bg-green-600");
        spanItem.classList.add("bg-red-500");
    }

    function showToast(message, bgColor) {
        Toastify({
            text: message,
            duration: 3000,
            backgroundColor: bgColor,
            close: true
        }).showToast();
    }
});
