/**
 * @file ProductManager.tsx
 * @description Product management table component with filtering, search, and selection capabilities.
 * Displays products in a table format with status indicators, checkboxes for selection, and
 * filtering options. Used across brand and retailer interfaces for managing product inventories.
 */

import { useState } from 'react';
import styles from './ProductManager.module.css';

import Package from '../../assets/icons/package.svg?react';
import Hash from '../../assets/icons/hash.svg?react';
import Zap from '../../assets/icons/zap.svg?react';
import Calendar from '../../assets/icons/calendar.svg?react';
import Search from '../../assets/icons/search.svg?react';

import type { ProductManagerProps } from '../../types/types';

// Status Pill Component
const StatusPill = ({ status }: { status: string }) => {
  const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <div className={`${styles.statusPill} ${styles[status]}`}>
      <span className={styles.statusDot}></span>
      {formattedStatus}
    </div>
  );
};

export default function ProductManager({ 
  products, 
  viewType, 
  selectedProductIds, 
  onSelectionChange 
}: ProductManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Product Selection Handler
  const handleSelectProduct = (productId: number) => {
    const newSelectedIds = selectedProductIds.includes(productId)
      ? selectedProductIds.filter(id => id !== productId)
      : [...selectedProductIds, productId];
    onSelectionChange(newSelectedIds);
  };

  // Product Filtering Section
  const filteredProducts = products
    .filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `#${product.id}`.includes(searchQuery)
    )
    .filter(product =>
      statusFilter === 'all' ? true : product.status === statusFilter
    );

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.filterWrapper}>
          <select
            className={styles.statusFilter}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="inFactory">In Factory</option>
            <option value="inTransit">In Transit</option>
            <option value="inRetailer">In Retailer</option>
            <option value="sold">Sold</option>
          </select>
        </div>
        <div className={styles.searchBar}>
          <Search className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by name or ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Table Section */}
      <div className={styles.tableContainer}>
        <table className={styles.productTable}>
          <thead>
            <tr>
              <th className={styles.checkboxHeader}></th>
              <th>
                <Package className={styles.headerIcon}/> 
                Name
                <span className={styles.resultCount}>({filteredProducts.length})</span>
              </th>
              <th>
                <Hash className={styles.headerIcon}/> <br />
                Product ID
              </th>
              <th>
                <Zap className={styles.headerIcon}/> <br />
                Status
              </th>
              <th>
                <Calendar className={styles.headerIcon}/> <br />
                Mint Date
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const isDisabled = 
                (viewType === 'brand' && product.status !== 'inFactory') ||
                (viewType === 'retailer' && product.status !== 'inRetailer');

              return (
                <tr 
                  key={product.id} 
                  className={`
                    ${selectedProductIds.includes(product.id) ? styles.selectedRow : ''}
                    ${isDisabled ? styles.disabledRow : ''}
                  `}
                >
                  <td>
                    <label className={styles.checkboxContainer}>
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        disabled={isDisabled}
                      />
                      <span className={styles.customCheckbox}></span>
                    </label>
                  </td>
                  <td>{product.name}</td>
                  <td>#{product.id}</td>
                  <td><StatusPill status={product.status} /></td>
                  <td>{product.mintDate}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}