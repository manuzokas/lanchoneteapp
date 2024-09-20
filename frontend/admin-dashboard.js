document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos
    const sidebarLinks = document.querySelectorAll('aside nav a');
    const dashboardSection = document.getElementById('dashboard');
    const manageProductsSection = document.getElementById('manage-products');
    const ordersSection = document.getElementById('orders');
    const productList = document.getElementById('product-list');
    console.log('Product list element:', productList);

    // Referências aos campos do formulário
    const addProductForm = document.getElementById('add-product-form');
    const cancelAddProductButton = document.getElementById('cancel-add-product');
    const nomeInput = document.getElementById('nome');
    const precoInput = document.getElementById('preco');
    const imagemInput = document.getElementById('imagem');
    const descricaoInput = document.getElementById('descricao');
    const categoriaInput = document.getElementById('categoria');

    // Função para mostrar uma seção e ocultar as outras
    function showSection(sectionToShow) {
        [dashboardSection, manageProductsSection, ordersSection].forEach(section => {
            if (section === sectionToShow) {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        });
    }

    // Adiciona ouvintes de eventos aos links da sidebar
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            const section = document.getElementById(sectionId);
            showSection(section);
        });
    });

    // Mostrar a seção de Dashboard por padrão
    showSection(dashboardSection);

    // Função para formatar o preço no formato R$ 00,00
    function formatPrice(value) {
        value = value.replace(/[^\d,]/g, ''); // Remove caracteres não numéricos e não vírgulas
        value = value.replace(/(\d)(\d{2}),/, '$1,$2'); // Adiciona vírgula após os centavos
        if (!value.startsWith('R$')) {
            value = 'R$ ' + value;
        }
        return value;
    }

    // Adiciona evento para formatação do preço
    precoInput.addEventListener('input', (e) => {
        e.target.value = formatPrice(e.target.value);
    });

    // Função para adicionar um produto à lista
    function addProductToList(product) {
        console.log('Adicionando produto à lista:', product);

        const productItem = document.createElement('div');
        productItem.classList.add('flex', 'items-center', 'justify-between', 'p-2', 'border-b');
        productItem.innerHTML = `
            <span>${product.nome} - ${product.preco} - ${product.categoria}</span>
            <button class="delete-button text-red-500" data-id="${product.id}">x</button>
        `;

        // Verifique se productList está definido e é um elemento HTML válido
        if (productList && productList instanceof HTMLElement) {
            productList.appendChild(productItem);
            console.log('Produto adicionado ao DOM:', productItem);
        } else {
            console.error("Erro: productList não está definido ou não é um elemento HTML válido.");
        }

        // Adiciona a funcionalidade de exclusão
        productItem.querySelector('.delete-button').addEventListener('click', async (e) => {
            const productId = e.target.getAttribute('data-id');
            const url = `/api/lanches/${productId}`;
            console.log('URL da requisição DELETE:', url); // Verifique se a URL está correta

            try {
                const response = await fetch(`http://localhost:5000/api/lanches/${productId}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    productItem.remove();
                    showToast('Produto removido com sucesso!', 'success');
                } else {
                    showToast('Falha ao remover produto. Verifique a conexão e tente novamente.', 'error');
                }
            } catch (error) {
                showToast('Ocorreu um erro inesperado: ' + error.message, 'error');
            }
        });
    }

    // Função para buscar e renderizar a lista de produtos inicialmente
    async function fetchProductsAndRenderList() {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/lanches'); // Atualizado aqui
            const products = await response.json();

            // Percorra a lista de produtos recebidos e renderize cada um
            products.forEach(product => {
                addProductToList(product);
            });
        } catch (error) {
            console.error('Erro ao obter produtos:', error);
        }
    }

    // Chame a função para buscar e renderizar a lista inicial
    fetchProductsAndRenderList();

    // Função para lidar com o envio do formulário
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validação dos campos
        if (!nomeInput.value || !precoInput.value || !descricaoInput.value) {
            showToast('Por favor, preencha todos os campos.', 'error');
            return;
        }

        // Remove o símbolo 'R$' e formata o preço para o formato numérico padrão
        const formattedPrice = precoInput.value.replace(/[^\d,]/g, '').replace(',', '.');

        // Cria um FormData para lidar com o upload de arquivos
        const formData = new FormData();
        formData.append('nome', nomeInput.value);
        formData.append('preco', formattedPrice);
        formData.append('imagem', imagemInput.files[0]); // Adiciona o arquivo da imagem
        formData.append('descricao', descricaoInput.value);
        formData.append('categoria', categoriaInput.value);

        // Adicione logs para verificar o conteúdo do FormData
        console.log('Arquivo selecionado:', imagemInput.files[0]);

        console.log('Enviando dados do formulário:', {
            nome: nomeInput.value,
            preco: formattedPrice,
            categoria: categoriaInput.value,
        });

        // Verifique o conteúdo do FormData
        for (let [key, value] of formData.entries()) {
            console.log(`FormData - ${key}:`, value);
        }

        // Envio dos dados para o servidor
        try {
            const response = await fetch('http://127.0.0.1:5000/api/lanches', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Produto adicionado:', result);
                addProductToList(result);
                showToast('Produto adicionado com sucesso!', 'success');
                addProductForm.reset(); // Limpa o formulário após sucesso
            } else {
                throw new Error('Falha ao adicionar produto.');
            }
        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    cancelAddProductButton.addEventListener('click', () => {
        addProductForm.reset(); // Limpa o formulário ao cancelar
    });

    // Função para mostrar mensagens de toast
    function showToast(message, type) {
        Toastify({
            text: message,
            duration: 3000,
            gravity: 'top',
            position: 'right',
            backgroundColor: type === 'success' ? 'green' : 'red',
        }).showToast();
    }
});
