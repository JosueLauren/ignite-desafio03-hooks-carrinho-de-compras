import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = window.localStorage.getItem('storagedCart')

    if(storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      let isProductInCart = cart.find(product => product.id === productId)

      if(!isProductInCart){
        let response = await api.get(`products/${productId}`)
        let product = {...response.data}

        product.amount = 1

        setCart([...cart, product])
        window.localStorage.setItem('storagedCart', JSON.stringify([...cart, product]))

      } else {
        updateProductAmount({productId: isProductInCart.id, amount: isProductInCart.amount + 1})
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const cartComProdutoRemovido = cart.filter(product => product.id !== productId)
      setCart([...cartComProdutoRemovido])
      window.localStorage.setItem('storagedCart', JSON.stringify([...cartComProdutoRemovido]))
    
    } catch(e) {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if(amount === 0) return
      const response = await api.get<Stock>(`stock/${productId}`)
      const qtdStock = response.data.amount

      if(amount > qtdStock){
        throw new Error('Quantidade solicitada fora de estoque')
        return
      }

      let auxCart = [...cart]

      auxCart.forEach(product => {
        if(product.id === productId){
          product.amount = amount
        }
      })

      setCart([...auxCart])
       window.localStorage.setItem('storagedCart', JSON.stringify([...auxCart]))

    } catch(e){
      toast.error(`${e}`);
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
