function! gin#util#reload(...) abort
  let bufnr = a:0 ? a:1 : bufnr()
  call denops#plugin#wait('gin')
  call denops#request('gin', 'util:reload', [bufnr])
endfunction

function! gin#util#expand(expr) abort
  call denops#plugin#wait('gin')
  return denops#request('gin', 'util:expand', [a:expr])
endfunction
