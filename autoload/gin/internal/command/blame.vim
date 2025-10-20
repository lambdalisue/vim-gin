" Safely wipe out buffers only if they are valid and exist
" This prevents accidentally wiping the current buffer when buffer numbers are invalid
function! s:safe_wipeout_buffers(bufnrs) abort
  for l:bufnr in a:bufnrs
    " Only wipeout if buffer number is valid (positive integer) and buffer exists
    if type(l:bufnr) == v:t_number && l:bufnr > 0 && bufexists(l:bufnr)
      execute 'silent! bwipeout ' . l:bufnr
    endif
  endfor
endfunction

" Cleanup paired GinBlame buffers when one of them is unloaded
" This function is called from BufUnload autocmd with timer to ensure proper cleanup
" abuf: buffer number that is being unloaded
" varnames: list of buffer variable names that store paired buffer numbers
function! s:cleanup_paired_buffers(abuf, varnames) abort
  " Prevent recursive autocmd triggers by checking if we're already cleaning up
  if exists('s:cleanup_in_progress')
    return
  endif
  let s:cleanup_in_progress = 1
  try
    let l:bufnrs = []
    for l:varname in a:varnames
      let l:bufnr = getbufvar(a:abuf, l:varname)
      " Check if bufnr is valid (not empty string, not 0)
      if type(l:bufnr) == v:t_number && l:bufnr > 0
        call add(l:bufnrs, l:bufnr)
      endif
    endfor
    call s:safe_wipeout_buffers(l:bufnrs)
  finally
    unlet s:cleanup_in_progress
  endtry
endfunction

" Setup BufUnload autocmd for GinBlame buffer cleanup
" varnames: list of buffer variable names that store paired buffer numbers
function! gin#internal#command#blame#setup_cleanup_autocmd(varnames) abort
  let l:varnames_str = string(a:varnames)
  execute printf(
        \ 'autocmd BufUnload <buffer> ++once call timer_start(0, { -> s:cleanup_paired_buffers(str2nr(expand(''<abuf>'')), %s) })',
        \ l:varnames_str
        \ )
endfunction
