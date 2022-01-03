" Apply workaround to expand() issue of completeslash on Windows
" Fixed on Vim 8.2.1747 but we need to support Vim 8.1.2424 though
" https://github.com/vim/vim/commit/8f187fc6304222956f94a700758a490cc8c0af99
if exists('+completeslash') && !has('patch-8.2.1747')
  function! gin#internal#util#cmd#expand(expr) abort
    let completeslash_saved = &completeslash
    try
      set completeslash&
      return expand(a:expr)
    finally
      let &completeslash = completeslash_saved
    endtry
  endfunction
else
  function! gin#internal#util#cmd#expand(expr) abort
    return expand(a:expr)
  endfunction
endif
