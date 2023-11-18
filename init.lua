vim.cmd [[packadd packer.nvim]]

require('packer').startup(function(use)
    use 'wbthomason/packer.nvim'
    use 'folke/tokyonight.nvim'
    use {
        '~/.config/nvim/neollama',
        requires = {'liangxianzhe/floating-input.nvim'},
        rocks = {'http'}
    }
end)

vim.cmd('colo tokyonight-storm')
