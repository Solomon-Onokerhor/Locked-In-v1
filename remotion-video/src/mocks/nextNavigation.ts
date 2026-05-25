export const useRouter = () => {
  return {
    push: (path: string) => { console.log('Mock navigate:', path) },
    replace: () => {},
    prefetch: () => {},
  };
};

export const usePathname = () => "/";
export const useSearchParams = () => {
    return { get: () => null };
};
