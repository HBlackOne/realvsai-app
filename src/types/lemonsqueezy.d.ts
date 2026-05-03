interface LemonSqueezyOrder {
  type: "orders";
  id: string;
  attributes: {
    store_id: number;
    customer_id: number;
    order_number: number;
    user_name: string;
    user_email: string;
    status: string;
    total: number;
    currency: string;
    first_order_item: {
      product_id: number;
      variant_id: number;
      product_name: string;
      variant_name: string;
      price: number;
    };
  };
}

interface LemonSqueezyEvent {
  event:
    | "Checkout.Success"
    | "Checkout.Close"
    | "PaymentMethodUpdate.Mounted"
    | "PaymentMethodUpdate.Closed"
    | "PaymentMethodUpdate.Updated";
  data?: LemonSqueezyOrder;
}

interface LemonSqueezyInstance {
  Setup: (config: {
    eventHandler: (event: LemonSqueezyEvent) => void;
  }) => void;
  Url: {
    Open: (url: string) => void;
    Close: () => void;
  };
}

declare global {
  interface Window {
    LemonSqueezy: LemonSqueezyInstance;
    createLemonSqueezy: () => void;
  }
}

export type {};
