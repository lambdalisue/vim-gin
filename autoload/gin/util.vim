function! gin#util#reload(...) abort
  let bufnr = a:0 ? a:1 : bufnr()
  call denops#plugin#wait('gin')
  call denops#request('gin', 'util:reload', [bufnr])
endfunction
